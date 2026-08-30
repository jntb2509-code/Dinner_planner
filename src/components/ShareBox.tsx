'use client';

import { useState } from 'react';

/** תיבת לינק לשיתוף. הלינק תמיד גלוי כטקסט, גם כשההעתקה נכשלת. */
export default function ShareBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="share">
      <span style={{ flex: 1 }}>{url}</span>
      <button
        type="button"
        className="small"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          } catch {
            // דפדפנים חוסמים clipboard בהקשר לא מאובטח — הטקסט גלוי ממילא
            // לבחירה ידנית, אז אין צורך להטריד את המשתמש בשגיאה.
          }
        }}
      >
        {copied ? 'הועתק ✓' : 'העתק'}
      </button>
    </div>
  );
}
