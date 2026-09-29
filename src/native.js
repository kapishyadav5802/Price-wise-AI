/* ══════════════════════════════════════════════════════════════════════════
   native shell bridge (Capacitor) — dynamically imported ONLY when the app
   runs inside the Android WebView, so the web bundle never pays for it.
   • dark immersive status bar matched to the arena theme
   • splash handover (hide once React is mounted)
   • Android hardware back button → in-app router (sheets close first)
   • real haptics exposed as window.__wgHaptic for platform.js
   ══════════════════════════════════════════════════════════════════════════ */
export async function initNative() {
  const [{ StatusBar, Style }, { SplashScreen }, { App }, { Haptics, ImpactStyle }] = await Promise.all([
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
    import('@capacitor/app'),
    import('@capacitor/haptics'),
  ])

  const styles = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy }
  window.__wgHaptic = (kind = 'light') => {
    Haptics.impact({ style: styles[kind] || ImpactStyle.Light }).catch(() => {})
  }

  const paintBar = () =>
    Promise.all([
      StatusBar.setStyle({ style: Style.Dark }),
      StatusBar.setBackgroundColor({ color: '#04050a' }),
    ]).catch(() => {})

  await paintBar()
  App.addListener('resume', paintBar).catch(() => {})

  /* hardware back: sheets first, then the in-app route stack, then exit */
  App.addListener('backButton', () => {
    window.dispatchEvent(new CustomEvent('wargrid-back'))
  }).catch(() => {})

  /* the web app is mounted — retire the native splash */
  await SplashScreen.hide().catch(() => {})
}
