use super::StorageBackend;
use js_sys::{Array, Date, Function, Object, Promise, Reflect};
use wasm_bindgen::{JsCast, JsValue};
use wasm_bindgen_futures::JsFuture;

pub async fn detect_best_backend() -> StorageBackend {
    if is_main_thread_context() {
        log::info!("Backend detection: main-thread context, selecting IndexedDB");
        return StorageBackend::IndexedDb;
    }

    if worker_supports_sync_access_handle().await {
        log::info!("Backend detection: worker OPFS SyncAccessHandle available, selecting Hybrid");
        StorageBackend::Hybrid
    } else {
        log::info!("Backend detection: OPFS SyncAccessHandle unavailable, selecting IndexedDB");
        StorageBackend::IndexedDb
    }
}

fn is_main_thread_context() -> bool {
    let global = js_sys::global();
    Reflect::has(&global, &JsValue::from_str("document")).unwrap_or(false)
}

async fn worker_supports_sync_access_handle() -> bool {
    let global = js_sys::global();
    let navigator = match get_property(&global, "navigator") {
        Some(value) => value,
        None => return false,
    };
    let storage = match get_property(&navigator, "storage") {
        Some(value) => value,
        None => return false,
    };
    let directory = match call_promise_method(&storage, "getDirectory", &Array::new()).await {
        Some(value) => value,
        None => return false,
    };

    let probe_name = format!("absurder_sql_backend_probe_{}", Date::now());
    let options = Object::new();
    if Reflect::set(
        &options,
        &JsValue::from_str("create"),
        &JsValue::from_bool(true),
    )
    .is_err()
    {
        return false;
    }

    let file_args = Array::new();
    file_args.push(&JsValue::from_str(&probe_name));
    file_args.push(&options);

    let file_handle = match call_promise_method(&directory, "getFileHandle", &file_args).await {
        Some(value) => value,
        None => return false,
    };

    let access_handle =
        match call_promise_method(&file_handle, "createSyncAccessHandle", &Array::new()).await {
            Some(value) => value,
            None => {
                cleanup_probe_file(&directory, &probe_name).await;
                return false;
            }
        };

    close_access_handle(&access_handle).await;
    cleanup_probe_file(&directory, &probe_name).await;
    true
}

fn get_property(target: &JsValue, name: &str) -> Option<JsValue> {
    Reflect::get(target, &JsValue::from_str(name))
        .ok()
        .filter(|value| !value.is_null() && !value.is_undefined())
}

fn get_function(target: &JsValue, name: &str) -> Option<Function> {
    get_property(target, name)?.dyn_into::<Function>().ok()
}

async fn call_promise_method(target: &JsValue, name: &str, args: &Array) -> Option<JsValue> {
    let function = get_function(target, name)?;
    let result = function.apply(target, args).ok()?;
    let promise = result.dyn_into::<Promise>().ok()?;
    JsFuture::from(promise).await.ok()
}

async fn close_access_handle(access_handle: &JsValue) {
    if let Some(close_fn) = get_function(access_handle, "close") {
        let result = close_fn.call0(access_handle);
        if let Ok(value) = result {
            if let Ok(promise) = value.dyn_into::<Promise>() {
                let _ = JsFuture::from(promise).await;
            }
        }
    }
}

async fn cleanup_probe_file(directory: &JsValue, probe_name: &str) {
    let args = Array::new();
    args.push(&JsValue::from_str(probe_name));
    let _ = call_promise_method(directory, "removeEntry", &args).await;
}
