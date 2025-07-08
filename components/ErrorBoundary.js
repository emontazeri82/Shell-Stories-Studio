import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("Caught by ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-red-500 bg-black">
          <h1 className="text-xl font-bold">Something went wrong.</h1>
          <pre className="mt-2 text-sm">{this.state.error?.toString()}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
