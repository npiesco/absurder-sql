use crate::{ColumnValue, DatabaseError, QueryResult, Row};
use sqlite_wasm_rs as sqlite;
use std::ffi::{CStr, CString, c_char, c_int, c_void};
use std::ptr::NonNull;

#[derive(Default)]
struct WriteMetadata {
    action: Option<c_int>,
}

unsafe extern "C" fn record_write(
    context: *mut c_void,
    action: c_int,
    table: *const c_char,
    _column: *const c_char,
    _database: *const c_char,
    source: *const c_char,
) -> c_int {
    if source.is_null()
        && !table.is_null()
        && matches!(
            action,
            sqlite::SQLITE_INSERT | sqlite::SQLITE_UPDATE | sqlite::SQLITE_DELETE
        )
        && !unsafe { CStr::from_ptr(table) }
            .to_bytes()
            .starts_with(b"sqlite_")
    {
        let metadata = unsafe { &mut *context.cast::<WriteMetadata>() };
        metadata.action.get_or_insert(action);
    }
    sqlite::SQLITE_OK
}

fn error(db: *mut sqlite::sqlite3, operation: &str) -> DatabaseError {
    let message = unsafe { CStr::from_ptr(sqlite::sqlite3_errmsg(db)) }.to_string_lossy();
    DatabaseError::new("SQLITE_ERROR", &format!("{operation}: {message}"))
}

pub(crate) struct Statement {
    raw: NonNull<sqlite::sqlite3_stmt>,
    db: *mut sqlite::sqlite3,
    action: Option<c_int>,
}

impl Statement {
    pub(crate) fn prepare(db: *mut sqlite::sqlite3, sql: &str) -> Result<Self, DatabaseError> {
        if db.is_null() {
            return Err(DatabaseError::new(
                "NULL_CONNECTION",
                "Database connection is closed",
            ));
        }
        let sql = CString::new(sql)
            .map_err(|_| DatabaseError::new("INVALID_SQL", "SQL contains a NUL byte"))?;
        let length = c_int::try_from(sql.as_bytes().len()).map_err(|_| {
            DatabaseError::new("INVALID_SQL", "SQL exceeds SQLite's byte-length range")
        })?;
        let mut metadata = WriteMetadata::default();
        let mut raw = std::ptr::null_mut();
        // Preparation is synchronous. The callback cannot escape this stack frame.
        let authorization = unsafe {
            sqlite::sqlite3_set_authorizer(
                db,
                Some(record_write),
                (&mut metadata as *mut WriteMetadata).cast(),
            )
        };
        if authorization != sqlite::SQLITE_OK {
            return Err(error(db, "Cannot inspect statement permissions"));
        }
        let prepared = unsafe {
            sqlite::sqlite3_prepare_v2(db, sql.as_ptr(), length, &mut raw, std::ptr::null_mut())
        };
        let prepare_error =
            (prepared != sqlite::SQLITE_OK).then(|| error(db, "Failed to prepare statement"));
        let reset = unsafe { sqlite::sqlite3_set_authorizer(db, None, std::ptr::null_mut()) };
        let statement = NonNull::new(raw).map(|raw| Self {
            raw,
            db,
            action: metadata.action,
        });
        if let Some(error) = prepare_error {
            return Err(error);
        }
        if reset != sqlite::SQLITE_OK {
            return Err(error(db, "Cannot reset statement inspection"));
        }
        statement.ok_or_else(|| {
            DatabaseError::new("INVALID_SQL", "SQL contains no executable statement")
        })
    }

    pub(crate) fn is_data_write(&self) -> bool {
        self.action.is_some()
            && unsafe {
                sqlite::sqlite3_stmt_readonly(self.raw.as_ptr()) == 0
                    && sqlite::sqlite3_stmt_isexplain(self.raw.as_ptr()) == 0
            }
    }

    fn bind(&self, params: &[ColumnValue]) -> Result<(), DatabaseError> {
        for (index, value) in params.iter().enumerate() {
            let index = c_int::try_from(index + 1)
                .map_err(|_| DatabaseError::new("SQLITE_RANGE", "Too many parameters"))?;
            let result = unsafe {
                match value {
                    ColumnValue::Null => sqlite::sqlite3_bind_null(self.raw.as_ptr(), index),
                    ColumnValue::Integer(value) | ColumnValue::Date(value) => {
                        sqlite::sqlite3_bind_int64(self.raw.as_ptr(), index, *value)
                    }
                    ColumnValue::Real(value) => {
                        sqlite::sqlite3_bind_double(self.raw.as_ptr(), index, *value)
                    }
                    ColumnValue::Text(value) | ColumnValue::BigInt(value) => {
                        sqlite::sqlite3_bind_text64(
                            self.raw.as_ptr(),
                            index,
                            value.as_ptr().cast(),
                            value.len() as u64,
                            sqlite::SQLITE_TRANSIENT(),
                            sqlite::SQLITE_UTF8 as u8,
                        )
                    }
                    ColumnValue::Blob(value) => sqlite::sqlite3_bind_blob64(
                        self.raw.as_ptr(),
                        index,
                        value.as_ptr().cast(),
                        value.len() as u64,
                        sqlite::SQLITE_TRANSIENT(),
                    ),
                }
            };
            if result != sqlite::SQLITE_OK {
                return Err(error(self.db, "Failed to bind parameter"));
            }
        }
        Ok(())
    }

    fn column(&self, index: c_int) -> Result<ColumnValue, DatabaseError> {
        let stmt = self.raw.as_ptr();
        unsafe {
            match sqlite::sqlite3_column_type(stmt, index) {
                sqlite::SQLITE_NULL => Ok(ColumnValue::Null),
                sqlite::SQLITE_INTEGER => Ok(ColumnValue::Integer(sqlite::sqlite3_column_int64(
                    stmt, index,
                ))),
                sqlite::SQLITE_FLOAT => Ok(ColumnValue::Real(sqlite::sqlite3_column_double(
                    stmt, index,
                ))),
                sqlite::SQLITE_TEXT => {
                    let pointer = sqlite::sqlite3_column_text(stmt, index);
                    let length = sqlite::sqlite3_column_bytes(stmt, index);
                    if pointer.is_null() {
                        return Err(error(self.db, "Failed to read text column"));
                    }
                    let bytes = std::slice::from_raw_parts(pointer, length as usize);
                    let value = std::str::from_utf8(bytes).map_err(|cause| {
                        DatabaseError::new(
                            "INVALID_TEXT",
                            &format!("SQLite text is not valid UTF-8: {cause}"),
                        )
                    })?;
                    Ok(ColumnValue::Text(value.to_owned()))
                }
                sqlite::SQLITE_BLOB => {
                    let pointer = sqlite::sqlite3_column_blob(stmt, index);
                    let length = sqlite::sqlite3_column_bytes(stmt, index);
                    if length == 0 {
                        return Ok(ColumnValue::Blob(Vec::new()));
                    }
                    if pointer.is_null() {
                        return Err(error(self.db, "Failed to read blob column"));
                    }
                    Ok(ColumnValue::Blob(
                        std::slice::from_raw_parts(pointer.cast(), length as usize).to_vec(),
                    ))
                }
                kind => Err(DatabaseError::new(
                    "SQLITE_TYPE",
                    &format!("Unexpected SQLite column type {kind}"),
                )),
            }
        }
    }

    pub(crate) fn execute(self, params: &[ColumnValue]) -> Result<QueryResult, DatabaseError> {
        self.bind(params)?;
        let count = unsafe { sqlite::sqlite3_column_count(self.raw.as_ptr()) };
        let mut columns = Vec::with_capacity(count as usize);
        for index in 0..count {
            let pointer = unsafe { sqlite::sqlite3_column_name(self.raw.as_ptr(), index) };
            if pointer.is_null() {
                return Err(error(self.db, "Failed to read column name"));
            }
            columns.push(
                unsafe { CStr::from_ptr(pointer) }
                    .to_str()
                    .map_err(|cause| DatabaseError::new("INVALID_TEXT", &cause.to_string()))?
                    .to_owned(),
            );
        }
        let before = unsafe { sqlite::sqlite3_total_changes64(self.db) };
        let mut rows = Vec::new();
        loop {
            match unsafe { sqlite::sqlite3_step(self.raw.as_ptr()) } {
                sqlite::SQLITE_ROW => {
                    let values = (0..count)
                        .map(|index| self.column(index))
                        .collect::<Result<_, _>>()?;
                    rows.push(Row { values });
                }
                sqlite::SQLITE_DONE => break,
                _ => return Err(error(self.db, "Failed to execute statement")),
            }
        }
        let changed = unsafe { sqlite::sqlite3_total_changes64(self.db) } != before;
        let affected_rows = if changed {
            u32::try_from(unsafe { sqlite::sqlite3_changes64(self.db) }).map_err(|_| {
                DatabaseError::new(
                    "SQLITE_RANGE",
                    "Affected row count exceeds the result range",
                )
            })?
        } else {
            0
        };
        let last_insert_id = if self.is_data_write() && self.action == Some(sqlite::SQLITE_INSERT) {
            Some(unsafe { sqlite::sqlite3_last_insert_rowid(self.db) })
        } else {
            None
        };
        let raw = self.raw.as_ptr();
        let db = self.db;
        std::mem::forget(self);
        if unsafe { sqlite::sqlite3_finalize(raw) } != sqlite::SQLITE_OK {
            return Err(error(db, "Failed to finalize statement"));
        }
        Ok(QueryResult {
            columns,
            rows,
            affected_rows,
            last_insert_id,
            execution_time_ms: 0.0,
        })
    }
}

impl Drop for Statement {
    fn drop(&mut self) {
        // SQLite finalization releases a partially executed statement on every error exit.
        unsafe { sqlite::sqlite3_finalize(self.raw.as_ptr()) };
    }
}
