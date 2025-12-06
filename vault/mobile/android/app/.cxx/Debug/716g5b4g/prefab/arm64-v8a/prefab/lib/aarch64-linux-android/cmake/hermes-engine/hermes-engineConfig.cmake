if(NOT TARGET hermes-engine::libhermes)
add_library(hermes-engine::libhermes SHARED IMPORTED)
set_target_properties(hermes-engine::libhermes PROPERTIES
    IMPORTED_LOCATION "/Users/nicholas.piescobraintrustdata.com/.gradle/caches/8.10.2/transforms/29c3d96c9dc7a67f62fbcfaad336dc61/transformed/hermes-android-0.76.9-debug/prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so"
    INTERFACE_INCLUDE_DIRECTORIES "/Users/nicholas.piescobraintrustdata.com/.gradle/caches/8.10.2/transforms/29c3d96c9dc7a67f62fbcfaad336dc61/transformed/hermes-android-0.76.9-debug/prefab/modules/libhermes/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

