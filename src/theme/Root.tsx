import React, {useEffect} from 'react';
import Root from '@theme-original/Root';
import { DocsSidebarChromeProvider } from '@site/src/theme/shared/docsSidebarChromeContext';

const SOFTWARE_RENDERING_ATTRIBUTE = 'data-xeno-software-rendering';

type NavigatorWithWebGpu = Navigator & {
  gpu?: {
    requestAdapter(): Promise<unknown | null>;
  };
};

function hasAcceptableWebGlPerformance(): boolean {
  const canvas = document.createElement('canvas');
  const contextAttributes: WebGLContextAttributes = {
    failIfMajorPerformanceCaveat: true,
  };

  try {
    const context =
      canvas.getContext('webgl2', contextAttributes) ??
      canvas.getContext('webgl', contextAttributes);

    if (!context) {
      return false;
    }

    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

async function hasAcceptableGraphicsPerformance(): Promise<boolean> {
  if (!hasAcceptableWebGlPerformance()) {
    return false;
  }

  const gpu = (navigator as NavigatorWithWebGpu).gpu;
  if (!gpu) {
    return true;
  }

  try {
    return (await gpu.requestAdapter()) !== null;
  } catch {
    return false;
  }
}

export default function RootWrapper(props: React.ComponentProps<typeof Root>): React.ReactNode {
  useEffect(() => {
    const documentRoot = document.documentElement;
    let active = true;

    void hasAcceptableGraphicsPerformance().then((hasAcceptablePerformance) => {
      if (active) {
        documentRoot.toggleAttribute(
          SOFTWARE_RENDERING_ATTRIBUTE,
          !hasAcceptablePerformance,
        );
      }
    });

    return () => {
      active = false;
      documentRoot.removeAttribute(SOFTWARE_RENDERING_ATTRIBUTE);
    };
  }, []);

  return (
    <DocsSidebarChromeProvider>
      <Root {...props} />
    </DocsSidebarChromeProvider>
  );
}
