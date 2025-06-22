import React from 'react';

export const AccountMore: React.FC = () => {
  return (
    <div className="w-full h-full bg-black p-6 flex flex-col overflow-y-auto pt-12 pb-12">
      <div className="flex flex-col space-y-6 text-[#00ff00] font-mono">
        <p>
          In a world where surveillance and data collection become a norm, Privasui was born with one mission — to return privacy to the people. 
          <br/>
          <br/>
          Built on top of the Sui blockchain, Privasui is a decentralized communication protocol designed for those who believe privacy is not a feature, but a fundamental right.
        </p>
        
        <p>
          <br/>
          Privasui empowers users to exchange messages and store data with end-to-end encryption, without relying on centralized services. Every message, every interaction, is owned by you —  undecryptable, unstoppable.
          <br/>
        </p>
        
        <p>
         <br/>
          And this is just the beginning...
          <br/>
          <br/>
          Thanks,
          <br/>
          @hello-world-admin
        
        </p>
        <div className='h-12'></div>
      </div>
    </div>
  );
};