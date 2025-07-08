function Error({ statusCode }) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-white bg-black text-center">
        <h1 className="text-5xl font-bold">
          {statusCode ? `Error ${statusCode}` : "An error occurred"}
        </h1>
        <p className="mt-4 text-lg">
          {statusCode === 404
            ? "This page could not be found."
            : "Something went wrong."}
        </p>
      </div>
    );
  }
  
  Error.getInitialProps = ({ res, err }) => {
    const statusCode = res?.statusCode || err?.statusCode || 404;
    return { statusCode };
  };
  
  export default Error;
  