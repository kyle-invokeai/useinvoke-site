interface IPhoneFrameProps {
  children: React.ReactNode;
}

export default function IPhoneFrame({ children }: IPhoneFrameProps) {
  return (
    <div className="relative mx-auto animate-fade-in-scale">
      {/* Phone outer frame */}
      <div className="relative w-[320px] h-[650px] bg-slate-900 rounded-[50px] p-3 shadow-2xl border border-slate-800">
        {/* Power button */}
        <div className="absolute -right-1 top-24 w-1 h-16 bg-slate-800 rounded-r-md"></div>
        
        {/* Volume buttons */}
        <div className="absolute -left-1 top-24 w-1 h-8 bg-slate-800 rounded-l-md"></div>
        <div className="absolute -left-1 top-36 w-1 h-8 bg-slate-800 rounded-l-md"></div>
        
        {/* Inner screen */}
        <div className="relative w-full h-full bg-black rounded-[40px] overflow-hidden">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-20">
            {/* Speaker */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-slate-800 rounded-full"></div>
            {/* Camera */}
            <div className="absolute top-1.5 right-3 w-3 h-3 bg-slate-800 rounded-full">
              <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-slate-950 rounded-full"></div>
            </div>
          </div>
          
          {/* Screen content */}
          <div className="w-full h-full bg-slate-950 pt-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
