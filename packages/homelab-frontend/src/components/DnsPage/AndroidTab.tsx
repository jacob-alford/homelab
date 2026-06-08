export function AndroidTab() {
  return (
    <>
      <h3 class="dns-page__heading">Private DNS</h3>
      <p class="dns-page__description">Android 9 or higher</p>
      <ol class="dns-page__steps">
        <li>
          Go to Settings → Network &amp; internet → Advanced → Private DNS.
        </li>
        <li>Select the Private DNS provider hostname option.</li>
        <li>
          Enter <code class="dns-page__code">ae8918.dns.nextdns.io</code> and hit Save.
        </li>
      </ol>
    </>
  )
}
