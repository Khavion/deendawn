package expo.modules.exactalarm

import android.app.AlarmManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Minimal surface expo-notifications is missing (none through 57.0.8):
 * - canScheduleExactAlarms(): whether DATE triggers register EXACT
 *   (setExactAndAllowWhileIdle) vs the silent inexact fallback.
 * - onExactAlarmStateChanged: fired when the user flips the "Alarms &
 *   reminders" special access while the app is running. Android also STOPS
 *   the app on revoke, so the JS-side KV state machine (exactAlarmState.ts)
 *   remains the source of truth across restarts — this event just makes the
 *   running-app path immediate.
 */
class ExactAlarmModule : Module() {
  private var receiver: BroadcastReceiver? = null

  private fun canSchedule(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    val alarmManager =
      appContext.reactContext?.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        ?: return false
    return alarmManager.canScheduleExactAlarms()
  }

  override fun definition() = ModuleDefinition {
    Name("ExactAlarm")

    Events("onExactAlarmStateChanged")

    Function("canScheduleExactAlarms") { canSchedule() }

    OnStartObserving {
      val context = appContext.reactContext ?: return@OnStartObserving
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && receiver == null) {
        val newReceiver = object : BroadcastReceiver() {
          override fun onReceive(ctx: Context?, intent: Intent?) {
            sendEvent("onExactAlarmStateChanged", mapOf("granted" to canSchedule()))
          }
        }
        // Protected system broadcast; NOT_EXPORTED satisfies the API 34+
        // context-receiver flag requirement (system senders are exempt from
        // the export restriction, so delivery still works).
        ContextCompat.registerReceiver(
          context,
          newReceiver,
          IntentFilter(AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED),
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
