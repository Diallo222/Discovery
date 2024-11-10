import React from "react";

class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log(error, errorInfo);
  }


  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col justify-center items-center w-full h-screen">
          <h1 className="text-2xl font-bold text-black uppercase">
            Something went wrong !
          </h1>
          <p className="text-xl font-bold text-black">
            Try refreshing the page.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
