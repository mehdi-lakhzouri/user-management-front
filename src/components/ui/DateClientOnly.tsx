"use client";
import { useEffect, useState } from "react";

export function DateClientOnly({ dateString }: { dateString: string }) {
  const [formatted, setFormatted] = useState("Chargement...");
  
  useEffect(() => {
    // Debug: Log the received date string
    console.log('DateClientOnly received:', { dateString, type: typeof dateString });
    
    if (!dateString) {
      setFormatted("Date non disponible");
      return;
    }
    
    try {
      // Gérer différents formats de date
      let date: Date;
      
      if (typeof dateString === 'string') {
        // Nettoyer la chaîne si nécessaire
        const cleanDateString = dateString.trim();
        date = new Date(cleanDateString);
        
        // Vérifier si c'est un timestamp en millisecondes
        if (isNaN(date.getTime()) && !isNaN(Number(cleanDateString))) {
          date = new Date(Number(cleanDateString));
        }
      } else {
        // Si ce n'est pas une string, essayer de convertir
        date = new Date(dateString as any);
      }
      
      // Vérifier si la date est valide
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
        const formattedDate = date.toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        console.log('Date formatted successfully:', formattedDate);
        setFormatted(formattedDate);
      } else {
        console.warn('Invalid date detected:', { dateString, parsedDate: date });
        setFormatted("Date invalide");
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      setFormatted("Erreur de format");
    }
  }, [dateString]);
  
  return <>{formatted}</>;
}
