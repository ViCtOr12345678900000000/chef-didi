export default function Advertise() {
  return (
    <div className="min-h-screen bg-[#fff8f0] py-8 px-4">
      <div className="max-w-[600px] mx-auto">
        <h1 className="text-center text-[32px] font-bold text-[#c0392b]">Partner With Chef Didi</h1>
        <p className="text-center bg-[#ffeaa7] py-2 px-4 rounded-full text-[13px] font-bold mt-3">Introductory Launch Price — Limited Slots</p>
        <p className="text-center text-stone-500 mt-3">Your brand in front of real people who love to cook and eat.</p>

        <div className="bg-white border-2 border-[#f0c27a] rounded-xl p-5 mt-5">
          <h2 className="font-bold text-[#c0392b]">1. Homepage Billboard</h2>
          <p className="text-[24px] font-bold my-2">₦50,000 / month</p>
          <p className="text-[14px] text-stone-600">Your logo + link at the top of every page.</p>
          <p className="text-[14px] font-bold mt-2">Only 1 slot available.</p>
        </div>

        <div className="bg-white border-2 border-[#f0c27a] rounded-xl p-5 mt-4">
          <h2 className="font-bold text-[#c0392b]">2. Sponsored Recipe</h2>
          <p className="text-[24px] font-bold my-2">₦25,000 / recipe</p>
          <p className="text-[14px] text-stone-600">Your product inside a Chef Didi recipe.</p>
          <p className="text-[14px] text-stone-600 mt-1">Example: "I used [YOUR BRAND] tomato paste for this party Jollof"</p>
          <p className="text-[14px] font-bold mt-2">Stays on the site forever.</p>
        </div>

        <div className="bg-white border-2 border-[#f0c27a] rounded-xl p-5 mt-4">
          <h2 className="font-bold text-[#c0392b]">3. Chef Didi Recommends</h2>
          <p className="text-[24px] font-bold my-2">₦15,000 / month</p>
          <p className="text-[14px] text-stone-600">Your logo in the sidebar on all recipes.</p>
          <p className="text-[14px] font-bold mt-2">Only 4 slots available.</p>
        </div>

        <h2 className="text-center font-bold text-xl mt-6">Book A Slot</h2>
        <p className="text-center text-[13px] text-stone-500">Fill this form. Only Chef Didi sees it.</p>

        <form action="https://formsubmit.co/Vardevictor78@gmail.com" method="POST" className="bg-white border rounded-xl p-5 mt-4 space-y-3">
          <input type="hidden" name="_subject" value="New Partner - Chef Didi" />
          <input type="hidden" name="_captcha" value="false" />
          <input type="text" name="Name" placeholder="Your Name" required className="w-full p-3 border rounded-lg" />
          <input type="text" name="Brand" placeholder="Brand Name" required className="w-full p-3 border rounded-lg" />
          <select name="Slot" required className="w-full p-3 border rounded-lg">
            <option value="">What do you want?</option>
            <option>Homepage Billboard - ₦50,000</option>
            <option>Sponsored Recipe - ₦25,000</option>
            <option>Chef Didi Recommends - ₦15,000</option>
          </select>
          <input type="text" name="Budget" placeholder="Your Budget" className="w-full p-3 border rounded-lg" />
          <input type="text" name="Contact" placeholder="Your WhatsApp or Email" required className="w-full p-3 border rounded-lg" />
          <textarea name="Message" placeholder="Tell Chef Didi about your brand" className="w-full p-3 border rounded-lg"></textarea>
          <button type="submit" className="bg-[#c0392b] text-white w-full py-3.5 rounded-lg font-bold">Send To Chef Didi</button>
        </form>

        <p className="text-center mt-4"><a href="#" onClick={()=>{window.location.hash=''; window.location.reload()}} className="text-[#c0392b] font-bold">← Back to Home</a></p>
      </div>
    </div>
  );
}
