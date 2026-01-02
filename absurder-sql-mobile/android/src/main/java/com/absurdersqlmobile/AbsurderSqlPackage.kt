// Custom modifications - DO NOT REGENERATE (added to noOverwrite in ubrn.config.yaml)
package com.absurdersqlmobile

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import java.util.HashMap

class AbsurderSqlPackage : TurboReactPackage() {
  companion object {
    const val INITIALIZER_NAME = "AbsurderSqlInitializer"
  }

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return when (name) {
      AbsurderSqlModule.NAME -> AbsurderSqlModule(reactContext)
      INITIALIZER_NAME -> AbsurderSqlInitializer(reactContext)
      else -> null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
      moduleInfos[AbsurderSqlModule.NAME] = ReactModuleInfo(
        AbsurderSqlModule.NAME,
        AbsurderSqlModule.NAME,
        false,  // canOverrideExistingModule
        false,  // needsEagerInit
        false,  // isCxxModule
        true // isTurboModule
      )
      // AbsurderSqlInitializer is a bridge module (not turbo module)
      moduleInfos[INITIALIZER_NAME] = ReactModuleInfo(
        INITIALIZER_NAME,
        INITIALIZER_NAME,
        false,  // canOverrideExistingModule
        false,  // needsEagerInit
        false,  // isCxxModule
        false   // isTurboModule - this is a bridge module
      )
      moduleInfos
    }
  }
}