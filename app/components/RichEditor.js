'use client';

import { useEffect, useRef, useId } from 'react';

/**
 * TinyMCE loaded from CDN — toolbar similar to a basic WordPress editor.
 */
export default function RichEditor({ value = '', onChange, height = 420 }) {
  const id = useId().replace(/:/g, '');
  const textareaId = `rich-editor-${id}`;
  const editorRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;

    function init() {
      if (cancelled || !window.tinymce) return;
      window.tinymce.remove(`#${textareaId}`);
      window.tinymce.init({
        selector: `#${textareaId}`,
        height,
        menubar: 'file edit view insert format tools table',
        plugins:
          'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table help wordcount',
        toolbar:
          'undo redo | blocks | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media | removeformat | code fullscreen',
        content_style: 'body { font-family: Inter, system-ui, sans-serif; font-size: 16px; line-height: 1.6; }',
        branding: false,
        promotion: false,
        convert_urls: false,
        setup(editor) {
          editorRef.current = editor;
          editor.on('init', () => {
            editor.setContent(value || '');
          });
          editor.on('change keyup setcontent', () => {
            onChangeRef.current?.(editor.getContent());
          });
        },
      });
    }

    if (window.tinymce) {
      init();
    } else {
      const existing = document.querySelector('script[data-tinymce]');
      if (existing) {
        existing.addEventListener('load', init);
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js';
        script.referrerPolicy = 'origin';
        script.setAttribute('data-tinymce', '1');
        script.onload = init;
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (window.tinymce) {
        try {
          window.tinymce.remove(`#${textareaId}`);
        } catch (_) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textareaId, height]);

  // Keep external value in sync when opening a different post
  useEffect(() => {
    const ed = editorRef.current;
    if (ed && value !== undefined) {
      const current = ed.getContent();
      if (value !== current) ed.setContent(value || '');
    }
  }, [value]);

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <textarea id={textareaId} defaultValue={value} />
    </div>
  );
}
