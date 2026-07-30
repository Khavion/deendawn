package expo.modules.audionoisy

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioManager
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * ACTION_AUDIO_BECOMING_NOISY bridge. expo-audio through 57.0.3 never
 * enables Media3's becoming-noisy handling on Android (upstream fix #48151
 * is merged but will not ship in a 57.0.x patch — see DECISIONS
 * 2026-07-30), so unplugging headphones would blast recitation from the
 * speaker. The player pauses on this event from the JS side instead.
 */
class AudioNoisyModule : Module() {
  private var receiver: BroadcastReceiver? = null

  override fun definition() = ModuleDefinition {
    Name("AudioNoisy")

    Events("onAudioBecomingNoisy")

    OnStartObserving {
      val context = appContext.reactContext ?: return@OnStartObserving
      if (receiver == null) {
        val newReceiver = object : BroadcastReceiver() {
          override fun onReceive(ctx: Context?, intent: Intent?) {
            if (intent?.action == AudioManager.ACTION_AUDIO_BECOMING_NOISY) {
              sendEvent("onAudioBecomingNoisy", emptyMap<String, Any>())
            }
          }
        }
        // Protected system broadcast; NOT_EXPORTED satisfies the API 34+
        // context-receiver flag requirement (system senders are exempt).
        ContextCompat.registerReceiver(
          context,
          newReceiver,
          IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY),
          ContextCompat.RECEIVER_NOT_EXPORTED
        )
        receiver = newReceiver
      }
    }

    OnStopObserving {
      val context = appContext.reactContext
      receiver?.let { r -> context?.unregisterReceiver(r) }
      receiver = null
    }
  }
}
