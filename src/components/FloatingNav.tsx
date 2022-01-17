import * as React from 'react';

import styles from './index.module.scss';

export function FloatingNavComponent(props: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    function viewportHandler(event) {
      requestAnimationFrame(() => {
        const el = ref.current;
        /* TODO Update iOS and iPad condition */
        if (el && (navigator.platform.indexOf('iOS') !== -1 || navigator.platform.indexOf('iPad') !== -1)) {
          el.style.bottom = window.innerHeight - window.visualViewport.height + 'px';
          // el.style.transform = `translate(0, -${window.innerHeight - window.visualViewport.height}px)`;
        }
      });
    }

    window.visualViewport.addEventListener('scroll', viewportHandler, { passive: true });
    window.visualViewport.addEventListener('resize', viewportHandler, { passive: true });
    return () => {
      window.visualViewport.removeEventListener('scroll', viewportHandler);
      window.visualViewport.removeEventListener('resize', viewportHandler);
    };
  });

  return (
    <div ref={ref} className={styles['floating-nav']}>
      {props.children}
    </div>
  );
}
