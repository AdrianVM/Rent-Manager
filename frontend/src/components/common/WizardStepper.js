import React from 'react';

function WizardStepper({ steps, currentStep }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '30px',
      padding: '20px 0'
    }}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: index < currentStep ? 'var(--primary-color)' :
                              index === currentStep ? 'var(--primary-color)' : '#e0e0e0',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '16px',
              marginBottom: '8px',
              transition: 'all 0.3s ease',
              border: index === currentStep ? '3px solid var(--primary-color)' : 'none',
              boxShadow: index === currentStep ? '0 0 10px rgba(37, 99, 235, 0.3)' : 'none'
            }}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            <div style={{
              fontSize: '12px',
              color: index <= currentStep ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: index === currentStep ? 'bold' : 'normal',
              maxWidth: '100px',
              textAlign: 'center'
            }}>
              {step}
            </div>
          </div>
          {index < steps.length - 1 && (
            <div style={{
              width: '80px',
              height: '2px',
              backgroundColor: index < currentStep ? 'var(--primary-color)' : '#e0e0e0',
              marginTop: '20px',
              marginLeft: '10px',
              marginRight: '10px',
              transition: 'all 0.3s ease'
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default WizardStepper;
