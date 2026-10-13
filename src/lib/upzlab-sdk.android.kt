package com.upzlab.sdk

import android.app.Activity
import android.app.Application
import android.os.Bundle
import android.util.Log
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import java.util.TimeZone
import java.util.concurrent.Executors

class UpzLabSdk(
    private val application: Application,
    private val appId: String,
    apiBaseUrl: String,
    private val accessTokenProvider: () -> String?,
    private val appVersion: String? = null,
    private val onError: (Throwable) -> Unit = { error ->
        Log.e(TAG, "Não foi possível registrar o check-in UpzLab.", error)
    },
) {
    private val apiBaseUrl = apiBaseUrl.trimEnd('/')
    private val executor = Executors.newSingleThreadExecutor()
    private val sessionId = UUID.randomUUID().toString()
    private var startedActivities = 0
    private var trackingRegistered = false

    private val lifecycleCallbacks = object : Application.ActivityLifecycleCallbacks {
        override fun onActivityCreated(activity: Activity, state: Bundle?) = Unit
        override fun onActivityResumed(activity: Activity) = Unit
        override fun onActivityPaused(activity: Activity) = Unit
        override fun onActivitySaveInstanceState(activity: Activity, state: Bundle) = Unit
        override fun onActivityDestroyed(activity: Activity) = Unit

        override fun onActivityStarted(activity: Activity) {
            val appEnteredForeground = synchronized(this@UpzLabSdk) {
                startedActivities += 1
                startedActivities == 1
            }
            if (appEnteredForeground) trackOpen()
        }

        override fun onActivityStopped(activity: Activity) {
            synchronized(this@UpzLabSdk) {
                startedActivities = (startedActivities - 1).coerceAtLeast(0)
            }
        }
    }

    init {
        require(appId.isNotBlank()) { "appId não pode ficar vazio." }
        require(apiBaseUrl.startsWith("https://") || apiBaseUrl.startsWith("http://")) {
            "apiBaseUrl deve ser uma URL HTTP(S) completa."
        }
    }

    @Synchronized
    fun startTracking() {
        if (trackingRegistered) return
        trackingRegistered = true
        application.registerActivityLifecycleCallbacks(lifecycleCallbacks)
    }

    fun trackOpen() {
        executor.execute {
            try {
                sendCheckin()
            } catch (error: Exception) {
                onError(error)
            }
        }
    }

    private fun sendCheckin() {
        val token = accessTokenProvider()?.takeIf(String::isNotBlank)
            ?: throw IllegalStateException("Sessão autenticada UpzLab não encontrada.")
        val payload = JSONObject()
            .put("app_id", appId)
            .put("platform", "android")
            .put("session_id", sessionId)
            .put("timezone", TimeZone.getDefault().id)
            .apply { appVersion?.let { put("app_version", it) } }

        val connection = URL("$apiBaseUrl/sdk/checkin").openConnection() as HttpURLConnection
        try {
            connection.requestMethod = "POST"
            connection.connectTimeout = 15_000
            connection.readTimeout = 15_000
            connection.doOutput = true
            connection.setRequestProperty("Content-Type", "application/json")
            connection.setRequestProperty("Authorization", "Bearer $token")
            connection.outputStream.use { output ->
                output.write(payload.toString().toByteArray(Charsets.UTF_8))
            }

            val responseCode = connection.responseCode
            val responseStream = if (responseCode in 200..299) {
                connection.inputStream
            } else {
                connection.errorStream
            }
            val responseBody = responseStream?.bufferedReader()?.use { it.readText() }.orEmpty()
            if (responseCode !in 200..299) {
                throw IOException("UpzLab respondeu HTTP $responseCode: $responseBody")
            }
        } finally {
            connection.disconnect()
        }
    }

    companion object {
        private const val TAG = "UpzLabSdk"
    }
}
