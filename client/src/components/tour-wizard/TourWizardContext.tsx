import { createContext, useContext, useState, ReactNode } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { InsertTour } from '@shared/schema';

interface TourWizardContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  completedSteps: Set<number>;
  markStepCompleted: (step: number) => void;
  form: UseFormReturn<InsertTour> | null;
  setForm: (form: UseFormReturn<InsertTour>) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
}

const TourWizardContext = createContext<TourWizardContextType | undefined>(undefined);

export function TourWizardProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [form, setForm] = useState<UseFormReturn<InsertTour> | null>(null);

  const markStepCompleted = (step: number) => {
    setCompletedSteps(prev => new Set(prev).add(step));
  };

  const goToStep = (step: number) => {
    // Only allow navigation to completed steps or the next step
    if (step <= currentStep || completedSteps.has(step - 1)) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    markStepCompleted(currentStep);
    setCurrentStep(prev => Math.min(prev + 1, 7));
  };

  const previousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <TourWizardContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        completedSteps,
        markStepCompleted,
        form,
        setForm,
        goToStep,
        nextStep,
        previousStep,
      }}
    >
      {children}
    </TourWizardContext.Provider>
  );
}

export function useTourWizard() {
  const context = useContext(TourWizardContext);
  if (!context) {
    throw new Error('useTourWizard must be used within TourWizardProvider');
  }
  return context;
}
