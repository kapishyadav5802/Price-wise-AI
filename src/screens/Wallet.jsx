/* ══════════════════════════════════════════════════════════════════════════
   WarGrid — Wallet
   Balance · add money · entry payments · winnings · withdraw · history
   ══════════════════════════════════════════════════════════════════════════ */
import React, { useMemo, useState } from 'react'
import { Icon } from '../icons'
import { Avatar, Badge, Btn, CountUp, EmptyState, Field, Input, ScreenHeader, SectionHead, Sheet, StatTile, Tabs } from '../ui'
import { useWG } from '../store'
import { cx, fmtDateShort, fmtTime, inr, relTime, sum } from '../utils'

const ADD_AMOUNTS = [100, 250, 500, 1000, 2000, 5000]

export default function Wallet() {
  const { wallet, addMoney, withdraw, back, navigate, bookings, toast, openSheet, closeSheet, sheet, me } = useWG()
  const [tab, setTab] = useState('all')
  const [amount, setAmount] = useState(500)
  const [custom, setCustom] = useState('')
  const [method, setMethod] = useState('UPI')
  const [wAmount, setWAmount] = useState('')
  const [processing, setProcessing] = useState(false)

  const spent = sum(bookings, (b) => b.amount || 0)
  const winnings = wallet.winnings
  const pending = sum(wallet.transactions.filter((t) => t.kind === 'credit' && t.type === 'Prize money').slice(0, 1), (t) => 0)

  const txns = useMemo(() => {
    const list = [...wallet.transactions].sort((a, b) => new Date(b.at) - new Date(a.at))
    if (tab === 'credit') return list.filter((t) => t.kind === 'credit')
    if (tab === 'debit') return list.filter((t) => t.kind === 'debit')
    if (tab === 'prize') return list.filter((t) => t.type === 'Prize money')
    return list
  }, [wallet.transactions, tab])

  const iconFor = (t) =>
    t.type === 'Prize money' ? 'trophy' : t.type === 'Entry fee' ? 'ticket' : t.type === 'Withdrawal' ? 'bank' : t.type === 'Refund' ? 'refresh' : t.type === 'Cashback' ? 'gift' : 'plus'

  const submitAdd = () => {
    const val = Number(custom || amount)
    if (!val || val < 50) return toast('Minimum ₹50', 'Add at least ₹50 to your wallet', 'error')
    setProcessing(true)
    setTimeout(() => {
      addMoney(val, method)
      setProcessing(false)
      setCustom('')
      closeSheet()
    }, 1200)
  }

  const submitWithdraw = () => {
    const val = Number(wAmount)
    if (!val || val < 100) return toast('Minimum ₹100', 'Withdrawals start at ₹100', 'error')
    if (val > wallet.balance) return toast('Insufficient balance', `Available ${inr(wallet.balance)}`, 'error')
    setProcessing(true)
    setTimeout(() => {
      withdraw(val)
      setProcessing(false)
      setWAmount('')
      closeSheet()
    }, 1400)
  }

  return (
    <>
      <ScreenHeader
        title="Wallet"
        subtitle={`${wallet.kyc} · ${wallet.upi}`}
        onBack={back}
        right={
          <button className="icon-btn" onClick={() => navigate('notifications')} aria-label="notifications">
            <Icon name="bell" />
          </button>
        }
      />

      <div className="page">
        {/* ── balance card ─────────────────────────────────────────────── */}
        <div className="wallet-card">
          <div className="row-between">
            <span className="kicker" style={{ color: 'rgba(255,255,255,.66)' }}>Available balance</span>
            <Badge tone="green" icon="shieldCheck">{wallet.kyc}</Badge>
          </div>
          <div className="balance" style={{ marginTop: 9 }}>
            <sup>₹</sup>
            <CountUp value={wallet.balance} />
          </div>
          <div className="tiny" style={{ color: 'rgba(255,255,255,.6)', marginTop: 7 }}>
            {inr(winnings)} lifetime winnings · {inr(spent)} spent on entries
          </div>

          <div className="wallet-actions">
            <WalletAction icon="plus" label="Add money" onClick={() => openSheet({ type: 'addMoney' })} />
            <WalletAction icon="arrowDown" label="Withdraw" onClick={() => openSheet({ type: 'withdraw' })} />
            <WalletAction icon="history" label="History" onClick={() => setTab('all')} />
            <WalletAction icon="shieldCheck" label="KYC" onClick={() => toast('KYC verified', 'Aadhaar + PAN on file · limit ₹50,000/day', 'success')} />
          </div>
        </div>

        {/* ── summary ──────────────────────────────────────────────────── */}
        <section className="section">
          <div className="stat-grid">
            <StatTile label="Winnings" value={winnings} prefix="₹" sub="all-time prize money" tone="gold" icon="trophy" spark={[30, 45, 38, 62, 55, 78, 70, 92]} />
            <StatTile label="Entry spend" value={spent} prefix="₹" sub={`${bookings.length} bookings`} icon="ticket" spark={[40, 32, 55, 44, 60, 48, 66, 58]} />
            <StatTile label="In escrow" value={sum(bookings.filter((b) => b.status === 'confirmed'), (b) => b.amount)} prefix="₹" sub="released after lobby starts" tone="green" icon="lock" />
            <StatTile label="Withdrawn" value={sum(wallet.transactions.filter((t) => t.type === 'Withdrawal'), (t) => t.amount)} prefix="₹" sub="to HDFC ••••4471" icon="bank" />
          </div>
        </section>

        {/* ── transactions ─────────────────────────────────────────────── */}
        <section className="section">
          <SectionHead title="Transaction history" rule />
          <Tabs
            value={tab}
            onChange={setTab}
            options={[
              { id: 'all', label: 'All' },
              { id: 'credit', label: 'Credits' },
              { id: 'debit', label: 'Debits' },
              { id: 'prize', label: 'Prizes' },
            ]}
          />
          {txns.length === 0 ? (
            <EmptyState icon="wallet" title="Nothing here yet" body="Transactions appear the moment you book a battle or win a prize." />
          ) : (
            <div className="card pad">
              {txns.map((t) => (
                <div className="txn" key={t.id}>
                  <span className={cx('ti', t.kind)}>
                    <Icon name={iconFor(t)} />
                  </span>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <b className="truncate">{t.type}</b>
                    <span className="truncate">{t.label}</span>
                    <span className="tiny faint" style={{ display: 'block', marginTop: 2 }}>
                      {fmtDateShort(t.at)} · {fmtTime(t.at)} · {t.method}
                    </span>
                  </div>
                  <span className={cx('amt', t.kind)}>{t.kind === 'credit' ? '+' : '−'}{inr(t.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── security ─────────────────────────────────────────────────── */}
        <section className="section">
          <SectionHead title="Payment protection" rule />
          <div className="card pad">
            {[
              { i: 'lock', t: 'Escrow-protected entries', s: 'Your entry fee is held by WarGrid and released to the organiser only after the lobby starts.' },
              { i: 'refresh', t: 'Auto refunds', s: 'Cancelled or full lobbies refund to your wallet within 24 hours — no support ticket needed.' },
              { i: 'shieldCheck', t: 'RBI-compliant gateway', s: 'UPI, cards and netbanking processed through PCI-DSS Level 1 partners.' },
              { i: 'scale', t: 'Dispute cover', s: 'Unpaid prize pools are covered by WarGrid up to ₹1,00,000 per event.' },
            ].map((f) => (
              <div className="rule-item" key={f.t}>
                <span className="n"><Icon name={f.i} size={12} /></span>
                <span>
                  <b className="h-head" style={{ fontSize: 12.3, display: 'block' }}>{f.t}</b>
                  <span className="tiny muted">{f.s}</span>
                </span>
              </div>
            ))}
          </div>
        </section>
        <div style={{ height: 8 }} />
      </div>

      {/* ── add money sheet ────────────────────────────────────────────── */}
      {sheet?.type === 'addMoney' && (
        <Sheet
          title="Add money"
          subtitle="Instant top-up · no fees"
          icon="plus"
          onClose={closeSheet}
          footer={
            <>
              <Btn variant="ghost" onClick={closeSheet}>Cancel</Btn>
              <Btn variant="primary" icon="bolt" loading={processing} onClick={submitAdd}>
                Add {inr(Number(custom || amount))}
              </Btn>
            </>
          }
        >
          <div className="kicker" style={{ marginBottom: 9 }}>Quick amounts</div>
          <div className="amount-grid">
            {ADD_AMOUNTS.map((a) => (
              <button key={a} onClick={() => { setAmount(a); setCustom('') }} style={!custom && amount === a ? { background: 'rgba(45,125,255,.2)', borderColor: 'var(--blue)', color: '#fff' } : null}>
                ₹{a.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
          <Field label="Or enter an amount" hint="Minimum ₹50 · maximum ₹50,000 per day">
            <div className="input-affix">
              <span className="affix">₹</span>
              <Input value={custom} inputMode="numeric" placeholder="0" onChange={(e) => setCustom(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </div>
          </Field>
          <div className="divider" />
          <div className="kicker" style={{ marginBottom: 9 }}>Payment method</div>
          {['UPI', 'Card', 'Netbanking'].map((m) => (
            <button key={m} className={cx('pay-opt', method === m && 'sel')} onClick={() => setMethod(m)}>
              <span className="pi"><Icon name={m === 'UPI' ? 'upi' : m === 'Card' ? 'card' : 'bank'} /></span>
              <span className="grow" style={{ textAlign: 'left' }}>
                <b>{m}</b>
                <span>{m === 'UPI' ? 'aarav@okhdfc · GPay / PhonePe / Paytm' : m === 'Card' ? 'Visa · Mastercard · RuPay' : 'HDFC ••••4471'}</span>
              </span>
              <span className="radio" />
            </button>
          ))}
        </Sheet>
      )}

      {/* ── withdraw sheet ─────────────────────────────────────────────── */}
      {sheet?.type === 'withdraw' && (
        <Sheet
          title="Withdraw winnings"
          subtitle="Arrives in 24 hours · no fees"
          icon="bank"
          onClose={closeSheet}
          footer={
            <>
              <Btn variant="ghost" onClick={closeSheet}>Cancel</Btn>
              <Btn variant="success" icon="arrowDown" loading={processing} onClick={submitWithdraw}>
                Withdraw {wAmount ? inr(Number(wAmount)) : ''}
              </Btn>
            </>
          }
        >
          <div className="card pad" style={{ marginBottom: 13 }}>
            <div className="row-between">
              <div>
                <div className="kicker">Withdrawable</div>
                <b className="display" style={{ fontSize: 24, color: 'var(--green)' }}>{inr(wallet.balance)}</b>
              </div>
              <Btn size="xs" variant="outline" onClick={() => setWAmount(String(wallet.balance))}>
                Max
              </Btn>
            </div>
          </div>
          <Field label="Amount" hint="Minimum ₹100 per withdrawal">
            <div className="input-affix">
              <span className="affix">₹</span>
              <Input value={wAmount} inputMode="numeric" placeholder="0" onChange={(e) => setWAmount(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </div>
          </Field>
          <div className="divider" />
          <div className="kicker" style={{ marginBottom: 9 }}>Destination</div>
          <div className="pay-opt sel">
            <span className="pi"><Icon name="bank" /></span>
            <span className="grow" style={{ textAlign: 'left' }}>
              <b>HDFC Bank ••••4471</b>
              <span>{me.name} · IFSC HDFC0001234 · verified</span>
            </span>
            <span className="radio" />
          </div>
          <div className="pay-opt" onClick={() => toast('Add a bank account', 'UPI payout coming soon', 'info')}>
            <span className="pi"><Icon name="upi" /></span>
            <span className="grow" style={{ textAlign: 'left' }}>
              <b>UPI · {wallet.upi}</b>
              <span>Instant payout · ₹25 fee</span>
            </span>
            <span className="radio" />
          </div>
          <div className="tiny faint" style={{ marginTop: 12, lineHeight: 1.55 }}>
            Withdrawals above ₹10,000 trigger a TDS certificate download in your profile. Prize money is taxable as per Indian law.
          </div>
        </Sheet>
      )}
    </>
  )
}

function WalletAction({ icon, label, onClick }) {
  return (
    <button className="wallet-action" onClick={onClick}>
      <Icon name={icon} />
      <span>{label}</span>
    </button>
  )
}
