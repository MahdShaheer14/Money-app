package com.budge.app

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.activity.ComponentActivity
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.budge.app.data.RuleEntity
import com.budge.app.data.RuleKind
import com.budge.app.data.TransactionType
import com.budge.app.ui.SmsViewModel
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * The whole SMS screen: permission gate, running totals, the transaction feed,
 * and a small rule builder. Built in code so the project has no XML layout
 * dependency — swap in Compose or XML freely, the ViewModel doesn't care.
 */
class SmsInboxActivity : ComponentActivity() {

    private val vm: SmsViewModel by viewModels()

    private lateinit var root: LinearLayout
    private lateinit var totalsLine: TextView
    private lateinit var permissionCard: LinearLayout
    private lateinit var feed: LinearLayout
    private lateinit var parseResult: TextView

    private val money = NumberFormat.getNumberInstance(Locale("en", "PK"))
    private val dateFmt = SimpleDateFormat("d MMM · h:mm a", Locale.getDefault())

    private val askForSms = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { grants ->
        val ok = grants[Manifest.permission.RECEIVE_SMS] == true ||
            hasSms()
        if (ok) {
            SmsBackfill.importRecent(this)   // pick up messages already on the phone
        }
        render()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(28), dp(20), dp(28))
            setBackgroundColor(0xFF0A0B0E.toInt())
        }
        val scroll = ScrollView(this).apply { addView(root) }
        setContentView(scroll)
        if (Build.VERSION.SDK_INT >= 21) {
            window.statusBarColor = 0xFF0A0B0E.toInt()
            window.navigationBarColor = 0xFF0A0B0E.toInt()
        }

        buildUi()
        observe()
        render()

        if (!hasSms()) askForSms.launch(
            arrayOf(
                Manifest.permission.RECEIVE_SMS,
                Manifest.permission.READ_SMS
            )
        )
    }

    // ---------------- UI ----------------

    private fun buildUi() {
        root.addView(text("Budge", 30f, 0xFFEDEFE6.toInt(), bold = true))
        root.addView(text("Bank SMS → transactions, automatically", 13f, 0xFF8A8F9C.toInt()))
        root.addView(space(18))

        totalsLine = text("", 15f, 0xFFD7FA4C.toInt(), bold = true)
        root.addView(card().apply { addView(totalsLine) })

        permissionCard = card().apply {
            addView(text("Allow SMS access", 15f, 0xFFEDEFE6.toInt(), bold = true))
            addView(text(
                "Budge reads bank alerts the moment they arrive and logs them. " +
                    "It never sends SMS and nothing leaves your phone.",
                12f, 0xFF8A8F9C.toInt()
            ))
            addView(space(10))
            addView(primaryButton("Allow SMS access") {
                askForSms.launch(
                    arrayOf(Manifest.permission.RECEIVE_SMS, Manifest.permission.READ_SMS)
                )
            })
        }
        root.addView(permissionCard)

        root.addView(space(10))
        root.addView(text("TRANSACTIONS", 10f, 0xFF8A8F9C.toInt(), bold = true).apply {
            letterSpacing = 0.08f
        })
        root.addView(space(8))

        feed = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        root.addView(feed)

        root.addView(space(20))
        root.addView(text("TEST A MESSAGE", 10f, 0xFF8A8F9C.toInt(), bold = true).apply {
            letterSpacing = 0.08f
        })
        root.addView(space(8))

        val senderField = input("Sender, e.g. HBL or 8556")
        val bodyField = input("Paste a bank SMS here")
        parseResult = text("", 12f, 0xFF7EE7B9.toInt())

        root.addView(card().apply {
            addView(senderField)
            addView(space(8))
            addView(bodyField)
            addView(space(10))
            addView(primaryButton("Parse it") {
                vm.testMessage(
                    senderField.text.toString().ifBlank { "HBL" },
                    bodyField.text.toString()
                )
            })
            addView(space(10))
            addView(parseResult)
        })

        root.addView(space(20))
        root.addView(text("TEACH A RULE", 10f, 0xFF8A8F9C.toInt(), bold = true).apply {
            letterSpacing = 0.08f
        })
        root.addView(space(8))

        val ruleSender = input("Sender → account, e.g. 8556")
        val ruleAccount = input("Account name, e.g. JazzCash")
        val ruleAmount = input("Amount → merchant, e.g. 421")
        val ruleMerchant = input("Merchant, e.g. Amazon Prime Video")

        root.addView(card().apply {
            addView(text("Sender rule", 13f, 0xFFEDEFE6.toInt(), bold = true))
            addView(space(6))
            addView(ruleSender)
            addView(space(6))
            addView(ruleAccount)
            addView(space(8))
            addView(ghostButton("Save sender rule") {
                if (ruleSender.text.isNotBlank() && ruleAccount.text.isNotBlank()) {
                    vm.addRule(
                        RuleEntity(
                            kind = RuleKind.SENDER,
                            matchSender = ruleSender.text.toString().trim(),
                            account = ruleAccount.text.toString().trim()
                        )
                    )
                    ruleSender.setText("")
                    ruleAccount.setText("")
                }
            })
            addView(space(16))
            addView(text("Merchant rule", 13f, 0xFFEDEFE6.toInt(), bold = true))
            addView(space(6))
            addView(ruleAmount)
            addView(space(6))
            addView(ruleMerchant)
            addView(space(8))
            addView(ghostButton("Save merchant rule") {
                val amt = ruleAmount.text.toString().toDoubleOrNull()
                if (ruleMerchant.text.isNotBlank()) {
                    vm.addRule(
                        RuleEntity(
                            kind = RuleKind.MERCHANT,
                            merchant = ruleMerchant.text.toString().trim(),
                            amount = amt,
                            category = "Entertainment"
                        )
                    )
                    ruleAmount.setText("")
                    ruleMerchant.setText("")
                }
            })
        })
    }

    private fun observe() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                launch {
                    vm.transactions.collect { list -> renderFeed(list) }
                }
                launch {
                    vm.totals.collect { t ->
                        totalsLine.text =
                            "Net Rs ${money.format(t.net)}   ·   " +
                                "out Rs ${money.format(t.spent)}   ·   " +
                                "in Rs ${money.format(t.earned)}"
                    }
                }
                launch {
                    vm.lastParse.collect { parseResult.text = it ?: "" }
                }
            }
        }
    }

    private fun render() {
        permissionCard.visibility = if (hasSms()) View.GONE else View.VISIBLE
    }

    private fun renderFeed(list: List<com.budge.app.data.TransactionEntity>) {
        feed.removeAllViews()
        if (list.isEmpty()) {
            feed.addView(text(
                "No transactions yet.\nWhen a bank SMS arrives it appears here automatically.",
                12f, 0xFF7A7F8C.toInt()
            ))
            return
        }
        list.take(60).forEach { tx ->
            val incoming = tx.type == TransactionType.CREDIT
            val row = card().apply {
                val line = LinearLayout(this@SmsInboxActivity).apply {
                    orientation = LinearLayout.HORIZONTAL
                }
                val left = LinearLayout(this@SmsInboxActivity).apply {
                    orientation = LinearLayout.VERTICAL
                    layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
                    addView(text(tx.title, 14f, 0xFFEDEFE6.toInt(), bold = true))
                    addView(text(
                        "${tx.account} · ${tx.category} · ${dateFmt.format(Date(tx.receivedAt))}",
                        11f, 0xFF8A8F9C.toInt()
                    ))
                }
                val amt = text(
                    (if (incoming) "+ " else "− ") + "Rs ${money.format(tx.amount)}",
                    14f,
                    if (incoming) 0xFF7EE7B9.toInt() else 0xFFFF7A66.toInt(),
                    bold = true
                )
                line.addView(left)
                line.addView(amt)
                addView(line)

                if (tx.confidence < 0.75) {
                    addView(text(
                        "Low confidence (${(tx.confidence * 100).toInt()}%) — check this one",
                        10f, 0xFFF2D06B.toInt()
                    ))
                }
            }
            feed.addView(row)
        }
    }

    // ---------------- helpers ----------------

    private fun hasSms(): Boolean {
        if (Build.VERSION.SDK_INT < 23) return true
        return checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED
    }

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()

    private fun text(s: String, size: Float, color: Int, bold: Boolean = false): TextView =
        TextView(this).apply {
            text = s
            textSize = size
            setTextColor(color)
            if (bold) setTypeface(typeface, android.graphics.Typeface.BOLD)
            setLineSpacing(0f, 1.25f)
        }

    private fun space(h: Int): View = View(this).apply {
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT, dp(h)
        )
    }

    private fun card(): LinearLayout = LinearLayout(this).apply {
        orientation = LinearLayout.VERTICAL
        setPadding(dp(14), dp(13), dp(14), dp(13))
        setBackgroundColor(0xFF131419.toInt())
        layoutParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply { bottomMargin = dp(8) }
    }

    private fun input(hint: String): EditText = EditText(this).apply {
        this.hint = hint
        textSize = 13f
        setTextColor(0xFFEDEFE6.toInt())
        setHintTextColor(0xFF6C7180.toInt())
        setBackgroundColor(0xFF1B1D24.toInt())
        setPadding(dp(12), dp(10), dp(12), dp(10))
    }

    private fun primaryButton(label: String, onClick: () -> Unit): Button =
        Button(this).apply {
            text = label
            textSize = 13f
            setTextColor(0xFF0C1004.toInt())
            setBackgroundColor(0xFFD7FA4C.toInt())
            setOnClickListener { onClick() }
        }

    private fun ghostButton(label: String, onClick: () -> Unit): Button =
        Button(this).apply {
            text = label
            textSize = 12f
            setTextColor(0xFFD7FA4C.toInt())
            setBackgroundColor(0xFF1B1D24.toInt())
            setOnClickListener { onClick() }
        }
}
