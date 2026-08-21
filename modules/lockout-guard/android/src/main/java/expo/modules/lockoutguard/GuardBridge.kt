package expo.modules.lockoutguard

object GuardBridge {
  @Volatile
  var onBlocked: ((appId: String, packageName: String, reason: String, cooldownUntil: Long) -> Unit)? = null
}
