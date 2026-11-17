import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { gsap } from 'gsap';
import styles from './InnovationPulse.module.scss';

interface IArticleDialogProps {
  title: string;
  source?: HTMLButtonElement;
  onClose: () => void;
  children: React.ReactNode;
}

/** Morph the panel bounds, keeping article text at its final size throughout. */
export function ArticleDialog({ title, source, onClose, children }: IArticleDialogProps): React.ReactElement {
  const panel = React.useRef<HTMLDivElement>();
  const overlay = React.useRef<HTMLDivElement>(null);
  const body = React.useRef<HTMLDivElement>(null);
  const preview = React.useRef<HTMLElement>();
  const timeline = React.useRef<gsap.core.Timeline>();
  const closing = React.useRef(false);
  const [mountedPanel, setMountedPanel] = React.useState<HTMLDivElement>();
  const attachPanel = React.useCallback((node: HTMLDivElement | null): void => {
    panel.current = node || undefined;
    if (node) setMountedPanel(node);
  }, []);
  const sourceOpacity = React.useRef(source?.style.opacity || '');
  const reduceMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const restoreSource = React.useCallback((): void => {
    if (source) source.style.opacity = sourceOpacity.current;
  }, [source]);
  const removePreview = React.useCallback((): void => {
    preview.current?.remove();
    preview.current = undefined;
  }, []);

  // Decorative snapshot only: never duplicate an interactive/focusable button.
  const makePreview = React.useCallback((rect: DOMRect): HTMLElement | undefined => {
    if (!source || !overlay.current) return undefined;
    removePreview();
    const copy = document.createElement('div');
    copy.className = source.className;
    copy.setAttribute('aria-hidden', 'true');
    Array.from(source.children).forEach(child => copy.appendChild(child.cloneNode(true)));
    copy.querySelectorAll('[id]').forEach(child => child.removeAttribute('id'));
    copy.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach(child => child.setAttribute('tabindex', '-1'));
    const style = getComputedStyle(source);
    Object.assign(copy.style, {
      position: 'fixed', left: rect.left + 'px', top: rect.top + 'px',
      width: rect.width + 'px', height: rect.height + 'px', boxSizing: 'border-box',
      margin: '0', transform: 'none', transition: 'none', pointerEvents: 'none',
      overflow: 'hidden', zIndex: '1', fontFamily: style.fontFamily,
      fontSize: style.fontSize, borderRadius: style.borderRadius
    });
    overlay.current.appendChild(copy);
    preview.current = copy;
    return copy;
  }, [source, removePreview]);

  React.useLayoutEffect(() => {
    if (!mountedPanel || !body.current || !overlay.current) return;
    const destination = mountedPanel.getBoundingClientRect();
    const origin = source?.isConnected ? source.getBoundingClientRect() : undefined;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finish = (): void => { timeline.current?.progress(1); };
    if (!media.matches) {
      const hasOrigin = origin && origin.width > 0 && origin.height > 0;
      const copy = hasOrigin ? makePreview(origin) : undefined;
      const radius = getComputedStyle(mountedPanel).borderRadius;
      const shadow = getComputedStyle(mountedPanel).boxShadow;
      // Pin the content width so expanding the shell never stretches or reflows text.
      gsap.set(body.current, { width: mountedPanel.clientWidth });
      gsap.set(mountedPanel, { position: 'fixed', margin: 0, maxHeight: 'none', overflow: 'hidden', willChange: 'left,top,width,height' });
      if (source) source.style.opacity = '0';
      timeline.current = gsap.timeline({ onComplete: () => {
        removePreview();
        gsap.set(mountedPanel, { clearProps: 'position,margin,left,top,width,height,maxHeight,overflow,opacity,borderRadius,boxShadow,willChange' });
        if (body.current) gsap.set(body.current, { clearProps: 'width,transform,opacity' });
      } });
      timeline.current
        .fromTo(overlay.current, { backgroundColor: 'rgba(10,22,40,0)' }, { backgroundColor: 'rgba(10,22,40,0.58)', duration: 0.38, ease: 'sine.out' }, 0)
        .fromTo(mountedPanel, hasOrigin ? {
          left: origin.left, top: origin.top, width: origin.width, height: origin.height,
          borderRadius: getComputedStyle(source as HTMLButtonElement).borderRadius,
          boxShadow: getComputedStyle(source as HTMLButtonElement).boxShadow
        } : { left: destination.left, top: destination.top + 12, width: destination.width, height: destination.height, opacity: 0 }, {
          left: destination.left, top: destination.top, width: destination.width, height: destination.height,
          opacity: 1, borderRadius: radius, boxShadow: shadow, duration: 0.52, ease: 'power3.out'
        }, 0)
        .fromTo(body.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' }, 0.2);
      if (copy && origin) {
        timeline.current
          .to(copy, { x: destination.left - origin.left, y: destination.top - origin.top, duration: 0.52, ease: 'power3.out' }, 0)
          .to(copy, { opacity: 0, duration: 0.16, ease: 'sine.out' }, 0.02);
      }
    }
    // A resize or preference change settles the current transition immediately.
    window.addEventListener('resize', finish);
    media.addEventListener('change', finish);
    return () => {
      window.removeEventListener('resize', finish);
      media.removeEventListener('change', finish);
      timeline.current?.kill();
      removePreview();
      restoreSource();
    };
  }, [mountedPanel, source, restoreSource, makePreview, removePreview]);

  const close = (): void => {
    if (closing.current) return;
    closing.current = true;
    timeline.current?.kill();
    removePreview();
    if (reduceMotion() || !panel.current || !body.current || !overlay.current) {
      restoreSource();
      onClose();
      return;
    }
    const element = panel.current;
    // Read the current animated bounds: an early Escape continues without jumping.
    const current = element.getBoundingClientRect();
    const origin = source?.isConnected ? source.getBoundingClientRect() : undefined;
    const visible = origin && origin.width > 0 && origin.height > 0 && origin.bottom > 0 && origin.top < window.innerHeight && origin.right > 0 && origin.left < window.innerWidth;
    const copy = visible ? makePreview(origin) : undefined;
    if (copy) gsap.set(copy, { opacity: 0 });
    if (!body.current.style.width) gsap.set(body.current, { width: element.clientWidth });
    gsap.set(element, {
      position: 'fixed', margin: 0, left: current.left, top: current.top,
      width: current.width, height: current.height, maxHeight: 'none',
      overflow: 'hidden', willChange: 'left,top,width,height'
    });
    timeline.current = gsap.timeline({ onComplete: () => { removePreview(); restoreSource(); onClose(); } });
    timeline.current
      .to(body.current, { opacity: 0, y: 4, duration: 0.12, ease: 'sine.out' }, 0)
      .to(element, visible ? {
        left: origin.left, top: origin.top, width: origin.width, height: origin.height,
        borderRadius: getComputedStyle(source as HTMLButtonElement).borderRadius,
        boxShadow: getComputedStyle(source as HTMLButtonElement).boxShadow,
        duration: 0.36, ease: 'power2.inOut'
      } : { opacity: 0, top: current.top + 8, duration: 0.2, ease: 'sine.inOut' }, 0)
      .to(overlay.current, { backgroundColor: 'rgba(10,22,40,0)', duration: visible ? 0.36 : 0.2, ease: 'sine.inOut' }, 0);
    if (copy) {
      timeline.current
        .to(copy, { opacity: 1, duration: 0.1, ease: 'sine.inOut' }, 0.26)
        .to(element, { opacity: 0, duration: 0.1, ease: 'sine.inOut' }, 0.26);
    }
  };

  return <Dialog.Root open onOpenChange={open => { if (!open) close(); }}>
    <Dialog.Portal>
      <Dialog.Overlay className={styles.articleOverlay} ref={overlay}>
        <Dialog.Content className={styles.articlePanel} ref={attachPanel}
          aria-describedby={undefined}
          onCloseAutoFocus={event => { event.preventDefault(); if (source?.isConnected) source.focus({ preventScroll: true }); }}>
          <div ref={body}>
            <header className={styles.articleHeader}>
              <div><p className={styles.articleEyebrow}>Innovation Daily / Article</p><Dialog.Title className={styles.articleTitle}>{title}</Dialog.Title></div>
              <Dialog.Close className={styles.articleClose} aria-label='Close story'>×</Dialog.Close>
            </header>
            <div className={styles.articleContent}>{children}</div>
          </div>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  </Dialog.Root>;
}
