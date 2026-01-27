import { useState } from 'react';
import { supabase } from '../config/supabase';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async () => {
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setIsSubscribing(true);

    try {
      const { error } = await supabase
        .from('user_emails')
        .insert({ email: email.toLowerCase().trim() });

      if (error) {
        if (error.code === '23505') {
          alert('This email is already subscribed!');
        } else {
          throw error;
        }
      } else {
        setSuccess(true);
        setEmail('');
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Failed to subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="bg-gray-800 text-white rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-2">📬 Stay Updated</h3>
      <p className="text-gray-400 text-sm mb-4">Get notified about new features and updates.</p>

      <div className="flex gap-2">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-gray-500 focus:outline-none"
        />
        <button
          onClick={handleSubscribe}
          disabled={isSubscribing}
          className="px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          {isSubscribing ? '...' : success ? '✓' : 'Subscribe'}
        </button>
      </div>
    </div>
  );
}
