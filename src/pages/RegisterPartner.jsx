export default function RegisterPartner() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-xl font-bold mb-4">Complete your registration</h1>

      <input placeholder="Full Name" />
      <input placeholder="Aadhaar Number" />
      <input placeholder="Driving License" />
      <input placeholder="Vehicle Number" />

      <select>
        <option>Bike</option>
        <option>Cycle</option>
      </select>

      <input placeholder="Bank Account Number" />
      <input placeholder="IFSC Code" />

      <button>Submit for Approval</button>
    </div>
  );
}
