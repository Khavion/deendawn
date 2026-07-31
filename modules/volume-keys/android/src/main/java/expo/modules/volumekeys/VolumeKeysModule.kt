package expo.modules.volumekeys

import android.view.KeyEvent
import android.view.Window
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Volume-key capture for the tasbih counter (handoff §6 screen 05: "volume
 * keys work too" — Android only; iOS hardware-button repurposing risks App
 * Review 2.5.9, see DECISIONS 2026-07-31).
 *
 * Interception exists ONLY while JS is observing (the tasbih screen is
 * focused): the current activity's Window.Callback is wrapped to consume
 * KEYCODE_VOLUME_UP/DOWN and emit an event instead of changing volume, and
 * the original callback is restored the moment observation stops — volume
 * behaves normally everywhere else in the app. No MainActivity patching, no
 * config plugin, same local-module pattern as modules/audio-noisy.
 */
class VolumeKeysModule : Module() {
  private var wrappedWindow: Window? = null
  private var originalCallback: Window.Callback? = null

  override fun definition() = ModuleDefinition {
    Name("VolumeKeys")

    Events("onVolumeKey")

    OnStartObserving {
      val activity = appContext.activityProvider?.currentActivity ?: return@OnStartObserving
      activity.runOnUiThread {
        if (originalCallback != null) return@runOnUiThread
        val window = activity.window ?: return@runOnUiThread
        val original = window.callback ?: return@runOnUiThread
        window.callback = object : Window.Callback by original {
          override fun dispatchKeyEvent(event: KeyEvent): Boolean {
            val code = event.keyCode
            if (code == KeyEvent.KEYCODE_VOLUME_UP || code == KeyEvent.KEYCODE_VOLUME_DOWN) {
              if (event.action == KeyEvent.ACTION_DOWN) {
                sendEvent(
                  "onVolumeKey",
                  mapOf("direction" to if (code == KeyEvent.KEYCODE_VOLUME_UP) "up" else "down")
                )
              }
              return true
            }
            return original.dispatchKeyEvent(event)
          }
        }
        wrappedWindow = window
        originalCallback = original
      }
    }

    OnStopObserving {
      val window = wrappedWindow
      val original = originalCallback
      wrappedWindow = null
      originalCallback = null
      if (window != null && original != null) {
        appContext.activityProvider?.currentActivity?.runOnUiThread {
          window.callback = original
        }
      }
    }

    OnDestroy {
      val window = wrappedWindow
      val original = originalCallback
      wrappedWindow = null
      originalCallback = null
      if (window != null && original != null) {
        window.callback = original
      }
    }
  }
}
