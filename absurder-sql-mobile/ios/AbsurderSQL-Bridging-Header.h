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
void absurder_db_close(uint64_t handle);
void absurder_free_string(char *s);

#endif /* AbsurderSQL_Bridging_Header_h */
