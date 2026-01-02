if(NOT TARGET fbjni::fbjni)
add_library(fbjni::fbjni SHARED IMPORTED)
set_target_properties(fbjni::fbjni PROPERTIES
    IMPORTED_LOCATION "/Users/nicholas.piescobraintrustdata.com/.gradle/caches/8.10.2/transforms/ecaf85af74491e145fd7c1a1474ff70a/transformed/fbjni-0.6.0/prefab/modules/fbjni/libs/android.x86/libfbjni.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/nicholas.piescobraintrustdata.com/.gradle/caches/8.10.2/transforms/ecaf85af74491e145fd7c1a1474ff70a/transformed/fbjni-0.6.0/prefab/modules/fbjni/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

