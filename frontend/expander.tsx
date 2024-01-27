import React from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface ExpanderProps {
  header: React.ReactNode;
}

export const Expander: React.FC<ExpanderProps> = (props) => {
  const [expand, setExpand] = React.useState(false);
  const toggleAcordion = () => {
    setExpand((prev) => !prev);
  };
  return <Accordion expanded={expand} disableGutters sx={{
    backgroundColor: "transparent",
    boxShadow: "none",
    backgroundImage: "none"
  }}>
    <AccordionSummary
      sx={{cursor: "auto !important", padding: 0}}
      expandIcon={<ExpandMoreIcon onClick={toggleAcordion} sx={{cursor: "pointer"}} />}>
      {props.header}
    </AccordionSummary>
    <AccordionDetails sx={{padding: 0}}>
      {props.children}
    </AccordionDetails>
  </Accordion>;
};
