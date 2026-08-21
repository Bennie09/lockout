package expo.modules.lockoutguard

object GuardBridge {
  @Volatile
  var onBlocked: ((appId: String, packageName: String) -> Unit)? = null
}
