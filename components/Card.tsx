import clsx from "clsx";

const Card = ({ className, children }) => {
  return (
    <div
      className={clsx(
        "px-10 py-4 bg-white",
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;