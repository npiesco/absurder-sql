//
//  AbsurderSQL-Bridging-Header.h
//  AbsurderSQL Mobile FFI declarations
//

#ifndef AbsurderSQL_Bridging_Header_h
#define AbsurderSQL_Bridging_Header_h

#include <stdint.h>

// FFI function declarations
uint64_t absurder_db_new(const char *name);
char *absurder_db_execute(uint64_t handle, const char *sql);
const char *absurder_db_execute_with_params(uint64_t handle, const char *sql, const char *params_json);
const char *absurder_get_error(void);
int32_t absurder_db_export(uint64_t handle, const char *path);
int32_t absurder_db_import(uint64_t handle, const char *path);
extern int32_t absurder_db_begin_transaction(uint64_t handle);
extern int32_t absurder_db_commit(uint64_t handle);
extern int32_t absurder_db_rollback(uint64_t handle);
extern int32_t absurder_db_execute_batch(uint64_t handle, const char* statements_json);
extern void absurder_db_close(uint64_t handle);
extern void absurder_free_string(char* s);

// Streaming API
extern uint64_t absurder_stmt_prepare_stream(uint64_t db_handle, const char* sql);
extern char* absurder_stmt_fetch_next(uint64_t stream_handle, int32_t batch_size);
extern int32_t absurder_stmt_stream_close(uint64_t stream_handle);

// Prepared statements
extern uint64_t absurder_db_prepare(uint64_t db_handle, const char* sql);
extern char* absurder_stmt_execute(uint64_t stmt_handle, const char* params_json);
extern int32_t absurder_stmt_finalize(uint64_t stmt_handle);

// Encryption (SQLCipher)
extern uint64_t absurder_db_new_encrypted(const char* name, const char* key);
extern int32_t absurder_db_rekey(uint64_t handle, const char* new_key);

#endif /* AbsurderSQL_Bridging_Header_h */
