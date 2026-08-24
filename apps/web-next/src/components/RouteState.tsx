import type { PropsWithChildren } from "react";
import styled from "styled-components";

const RouteStateLayout = styled.main`
  display: grid;
  min-height: calc(100vh - 73px);
  place-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;

  h1 {
    max-width: 720px;
    margin: 8px auto;
    font-size: clamp(2rem, 6vw, 4rem);
  }

  p {
    max-width: 660px;
    margin: 0 auto;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

export function RouteState({
  eyebrow,
  title,
  description,
  children,
}: PropsWithChildren<{
  eyebrow?: string;
  title: string;
  description?: string;
}>) {
  return (
    <RouteStateLayout role="status">
      {eyebrow ? <span>{eyebrow}</span> : null}
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {children}
    </RouteStateLayout>
  );
}
