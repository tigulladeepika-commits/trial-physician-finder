"use client"; // << Add this

import { useState } from "react";
import { useTrials } from "./hooks/useTrials";
import TrialCard from "./components/TrialCard";

export default function Page() {
  const [condition, setCondition] = useState("diabetes");
  const [state, setState] = useState("TX");

  const { trials, loading } = useTrials(condition, state);

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        trials.map((trial) => <TrialCard key={trial.protocolSection.identificationModule.nctId} trial={trial} />)
      )}
    </div>
  );
}