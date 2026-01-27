import * as GirderComponents from '@/components';

export default function install(app) {
  // Register all components
  Object.keys(GirderComponents).forEach((componentName) => {
    app.component(componentName, GirderComponents[componentName]);
  });
}