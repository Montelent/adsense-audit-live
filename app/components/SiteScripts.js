'use client';

import { useEffect, useState } from 'react';

export default function SiteScripts() {
  const [scripts, setScripts] = useState(null);

  useEffect(() => {
    fetch('/api/settings?type=scripts')
      .then((r) => r.json())
      .then((d) => setScripts(d.scripts || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!scripts?.head) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = scripts.head;
    const nodes = Array.from(wrap.childNodes);
    nodes.forEach((node) => {
      if (node.nodeName === 'SCRIPT') {
        const s = document.createElement('script');
        if (node.src) s.src = node.src;
        if (node.async) s.async = true;
        if (node.defer) s.defer = true;
        s.textContent = node.textContent;
        document.head.appendChild(s);
      } else if (node.nodeType === 1) {
        document.head.appendChild(node.cloneNode(true));
      }
    });
  }, [scripts]);

  if (!scripts) return null;
  return (
    <>
      {scripts.bodyStart ? <div dangerouslySetInnerHTML={{ __html: scripts.bodyStart }} /> : null}
      {scripts.bodyEnd ? (
        <div className="fixed bottom-0 left-0 w-0 h-0 overflow-hidden" dangerouslySetInnerHTML={{ __html: scripts.bodyEnd }} />
      ) : null}
    </>
  );
}
