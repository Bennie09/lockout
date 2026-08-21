package expo.modules.lockoutguard

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray
import java.lang.ref.WeakReference

class LockoutGuardModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("LockoutGuard")

    Events("onBlocked")

    OnCreate {
      val weak = WeakReference(this@LockoutGuardModule)
      GuardBridge.onBlocked = { appId, pkg, reason, cooldownUntil ->
        weak.get()?.sendEvent(
          "onBlocked",
          mapOf(
            "appId" to appId,
            "packageName" to pkg,
            "reason" to reason,
            "cooldownUntil" to cooldownUntil,
          ),
        )
      }
    }

    OnDestroy {
      GuardBridge.onBlocked = null
    }

    Function("isAppInstalled") { packageName: String ->
      val ctx = appContext.reactContext ?: return@Function false
      try {
        ctx.packageManager.getPackageInfo(packageName, 0)
        true
      } catch (_: Exception) {
        false
      }
    }

    Function("hasUsageAccess") {
      val ctx = appContext.reactContext ?: return@Function false
      hasUsage(ctx)
    }

    Function("openAppInfo") {
      val ctx = appContext.reactContext ?: return@Function false
      val intent = Intent(
        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
        Uri.parse("package:${ctx.packageName}"),
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
      true
    }

    Function("openUsageAccessSettings") {
      val ctx = appContext.reactContext ?: return@Function false
      // Open the app list, not the Lockout-only page. Sideloaded APKs on Android 13+
      // grey out that detail screen as "restricted settings" until App info unlocks it.
      ctx.startActivity(
        Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
      )
      true
    }

    Function("hasOverlayPermission") {
      val ctx = appContext.reactContext ?: return@Function false
      Settings.canDrawOverlays(ctx)
    }

    Function("openOverlaySettings") {
      val ctx = appContext.reactContext ?: return@Function false
      val intent = Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:${ctx.packageName}"),
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
      true
    }

    Function("isIgnoringBatteryOptimizations") {
      val ctx = appContext.reactContext ?: return@Function true
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return@Function true
      val pm = ctx.getSystemService(Context.POWER_SERVICE) as PowerManager
      pm.isIgnoringBatteryOptimizations(ctx.packageName)
    }

    Function("requestIgnoreBatteryOptimizations") {
      val ctx = appContext.reactContext ?: return@Function false
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return@Function true
      val intent = Intent(
        Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
        Uri.parse("package:${ctx.packageName}"),
      ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      ctx.startActivity(intent)
      true
    }

    Function("setWatch") { json: String ->
      val ctx = appContext.reactContext ?: return@Function false
      JSONArray(json)
      ctx.getSharedPreferences(GuardService.PREFS, Context.MODE_PRIVATE)
        .edit()
        .putString(GuardService.KEY_WATCH, json)
        .apply()
      true
    }

    Function("setFast") { enabled: Boolean ->
      val ctx = appContext.reactContext ?: return@Function false
      ctx.getSharedPreferences(GuardService.PREFS, Context.MODE_PRIVATE)
        .edit()
        .putBoolean(GuardService.KEY_FAST, enabled)
        .apply()
      true
    }

    Function("getUsageSnapshot") {
      val ctx = appContext.reactContext ?: return@Function emptyMap<String, Any>()
      GuardService.usageSnapshot(ctx)
    }

    Function("setBlocked") { json: String ->
      val ctx = appContext.reactContext ?: return@Function false
      JSONArray(json)
      ctx.getSharedPreferences(GuardService.PREFS, Context.MODE_PRIVATE)
        .edit()
        .putString(GuardService.KEY_BLOCKED, json)
        .apply()
      true
    }

    Function("startGuard") {
      val ctx = appContext.reactContext ?: return@Function false
      ctx.getSharedPreferences(GuardService.PREFS, Context.MODE_PRIVATE)
        .edit()
        .putBoolean(GuardService.KEY_ENABLED, true)
        .apply()
      GuardService.start(ctx.applicationContext)
      true
    }

    Function("stopGuard") {
      val ctx = appContext.reactContext ?: return@Function false
      ctx.getSharedPreferences(GuardService.PREFS, Context.MODE_PRIVATE)
        .edit()
        .putBoolean(GuardService.KEY_ENABLED, false)
        .apply()
      GuardService.stop(ctx.applicationContext)
      true
    }
  }

  private fun hasUsage(ctx: Context): Boolean {
    val appOps = ctx.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        ctx.packageName,
      )
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        ctx.packageName,
      )
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }
}
