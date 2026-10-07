import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="fatal">
        <p className="mono">( Light leak )</p>
        <h1>
          The film <em>was exposed.</em>
        </h1>
        <button className="btn btn-solid" onClick={() => window.location.reload()}>
          Load a fresh roll
        </button>
      </div>
    );
  }
}
