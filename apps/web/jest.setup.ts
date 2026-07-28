import '@testing-library/jest-dom';

// jsdom doesn't implement ResizeObserver, but several Radix primitives
// (Checkbox, Select, ...) use it internally (@radix-ui/react-use-size) -
// without this, rendering any of them throws "ResizeObserver is not
// defined" during the layout-effect commit, unrelated to the component
// under test.
class ResizeObserverStub {
  observe() {
    /* no-op in jsdom */
  }
  unobserve() {
    /* no-op in jsdom */
  }
  disconnect() {
    /* no-op in jsdom */
  }
}

global.ResizeObserver = ResizeObserverStub;
