
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { VisitType } from '../../types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/db';

export const BookVisit: React.FC = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  
  const [selectedType, setSelectedType] = useState<VisitType | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Updated Founder/Admin Email
  const ADMIN_EMAIL = "salonisales2021@gmail.com"; 

  const visitOptions = [
    {
      type: VisitType.EXPERIENCE_CENTRE,
      title: "Experience Centre",
      desc: "Visit our state-of-the-art showroom in Gandhi Nagar to see the full collection in person.",
      icon: "🏢",
      location: "Saloni Sales Experience Centre, Gandhi Nagar, Delhi"
    },
    {
      type: VisitType.MEET_FOUNDER,
      title: "Meet Mr. Sarthak Huria",
      desc: "One-on-one business strategy meeting with the founder to discuss long-term partnership.",
      icon: "🤝",
      location: "Saloni Sales HO, Delhi"
    },
    {
      type: VisitType.DOORSTEP,
      title: "Doorstep Visit",
      desc: "Our representative will visit your shop/boutique with samples and catalogs.",
      icon: "🚚",
      location: user?.businessName ? `${user.businessName} (Client Location)` : "Client Location"
    }
  ];

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !date || !time || !user) return;
    
    setIsSubmitting(true);
    const success = await db.createVisitRequest({
        userId: user.id,
        userName: user.businessName || user.fullName,
        type: selectedType,
        requestedDate: date,
        requestedTime: time,
        notes: notes
    });

    if (success) {
        setIsSubmitted(true);
    } else {
        alert("Failed to submit request. Please try again.");
    }
    setIsSubmitting(false);
  };

  const getGoogleCalendarLink = () => {
    if (!selectedType || !date || !time) return '#';

    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

    const formatGCalDate = (d: Date) => {
        return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };

    const option = visitOptions.find(o => o.type === selectedType);
    const title = `Saloni Sales: ${option?.title}`;
    const details = `Visit Type: ${option?.title}\nClient: ${user?.businessName || 'Guest'}\nPhone: ${user?.mobile || 'N/A'}\nNotes: ${notes}`;
    const location = option?.location || 'Delhi';

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${formatGCalDate(startDateTime)}/${formatGCalDate(endDateTime)}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}&add=${ADMIN_EMAIL}`;
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-lg w-full p-8 rounded-lg shadow-xl text-center animate-fade-in border-t-4 border-rani-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Appointment Requested!</h2>
          <p className="text-gray-600 mb-6">
            Your request for a <strong>{visitOptions.find(o => o.type === selectedType)?.title}</strong> on <strong>{date}</strong> at <strong>{time}</strong> has been received. Our team will confirm shortly.
          </p>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-8">
            <h4 className="font-bold text-blue-800 text-sm mb-2 uppercase">Sync to Calendar</h4>
            <p className="text-xs text-blue-600 mb-4">Click below to add this to your Google Calendar. This will also send an invite to Saloni Sales Accounts.</p>
            <a 
              href={getGoogleCalendarLink()} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded shadow-sm hover:shadow-md transition-all font-bold text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z"/></svg>
              Add to Google Calendar
            </a>
          </div>

          <Button onClick={() => navigate('/')} variant="outline">Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-heading font-bold text-luxury-black mb-3">Book a Visit</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience the luxury of Saloni Sales in person. Choose how you would like to connect with us.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {visitOptions.map((option) => (
            <div 
              key={option.type}
              onClick={() => setSelectedType(option.type)}
              className={`
                cursor-pointer p-6 rounded-lg border-2 transition-all duration-300 relative overflow-hidden group
                ${selectedType === option.type 
                  ? 'border-rani-500 bg-white shadow-xl transform scale-105 z-10' 
                  : 'border-white bg-white/50 hover:bg-white hover:border-rani-200 hover:shadow-lg'
                }
              `}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{option.icon}</div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">{option.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{option.desc}</p>
              
              {selectedType === option.type && (
                <div className="absolute top-3 right-3 text-rani-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedType && (
          <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-100 animate-fade-in-up">
            <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
              <span className="bg-rani-100 text-rani-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              Schedule Your {visitOptions.find(o => o.type === selectedType)?.title}
            </h3>
            
            <form onSubmit={handleBook} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                 <Input 
                    label="Preferred Date" 
                    type="date" 
                    required 
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                 />
                 <Input 
                    label="Preferred Time" 
                    type="time" 
                    required 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                 />
              </div>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                    <textarea 
                        className="w-full px-4 py-2 bg-white border border-gray-300 rounded-sm focus:ring-1 focus:ring-rani-500 outline-none h-[106px] resize-none"
                        placeholder="Any specific collections you want to see or topics to discuss?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                 </div>
              </div>

              <div className="md:col-span-2 pt-4 flex justify-end">
                <Button size="lg" className="w-full md:w-auto px-12" disabled={isSubmitting}>
                   {isSubmitting ? 'Submitting...' : 'Confirm Appointment Request'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
