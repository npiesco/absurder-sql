/// Build script for AbsurderSQL Mobile
/// UniFFI 0.29+ uses proc-macros, so no UDL scaffolding generation needed
/// The uniffi::export macro generates everything at compile time

fn main() {
    // UniFFI 0.29+ uses proc-macros exclusively
    // Bindings are generated via #[uniffi::export] annotations
    // No build script scaffolding needed
    
    #[cfg(feature = "uniffi-bindings")]
    {
        println!("cargo:warning=UniFFI bindings feature enabled - using proc-macro approach");
    }
}
