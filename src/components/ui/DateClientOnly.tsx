"use client";
import { useEffect, useState } from "react";

export function DateClientOnly({ dateString }: { dateString: string }) {
  const [formatted, setFormatted] = useState("Date inconnue");
  useEffect(() => {
    if (dateString) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        setFormatted(
          date.toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        );
      }
    }
  }, [dateString]);
  return <>{formatted}</>;
}
