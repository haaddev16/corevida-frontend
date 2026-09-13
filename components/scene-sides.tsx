"use client";

export function SceneSides({
  left,
  right,
}: {
  left: string;
  right: string;
}) {
  return (
    <>
      <p className="intake-quote quote-live pointer-events-none fixed top-[22%] left-6 z-[5] hidden max-w-[140px] text-[1.3rem] lg:block">
        {left.split(" ").map((word) => (
          <span key={word}>
            {word}
            <br />
          </span>
        ))}
      </p>
      <p className="intake-quote quote-live pointer-events-none fixed top-[22%] right-8 z-[5] hidden max-w-[150px] text-right text-[1.3rem] lg:block">
        {right.split(" ").map((word) => (
          <span key={word}>
            {word}
            <br />
          </span>
        ))}
      </p>
    </>
  );
}
