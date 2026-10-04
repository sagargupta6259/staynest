import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../../api/client.js';
import { STAY_TYPES } from '../../utils/format.js';

export const validateTitle = (title) => {
  const trimmed = (title || '').trim();
  if (!trimmed) return 'Title is required.';
  if (trimmed.length < 10) return 'Title must be at least 10 characters.';
  if (trimmed.length > 100) return 'Title cannot exceed 100 characters.';
  return '';
};

export const validateDescription = (description) => {
  const trimmed = (description || '').trim();
  if (!trimmed) return 'Description is required.';
  if (trimmed.length < 30) return 'Description must be at least 30 characters.';
  return '';
};

export const validatePrice = (price) => {
  const str = String(price ?? '').trim();
  if (!str) return 'Price is required.';
  const num = Number(str);
  if (isNaN(num) || num <= 0) return 'Price must be greater than 0.';
  return '';
};

export const validateImageUrl = (url) => {
  const str = String(url ?? '').trim();
  if (!str) return 'Image URL is required.';
  try {
    const parsed = new URL(str);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'Please enter a valid image URL.';
    }
    return '';
  } catch {
    return 'Please enter a valid image URL.';
  }
};

const empty = {
  title: '',
  description: '',
  type: 'homestay',
  city: '',
  state: '',
  address: '',
  pricePerNight: '',
  maxGuests: 2,
  bedrooms: 1,
  amenities: '',
  imageUrl: '',
};

export default function ListingForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/listings/${id}`).then(({ data }) =>
      setForm({
        ...empty,
        ...data,
        amenities: (data.amenities || []).join(', '),
        imageUrl: (data.images && data.images[0]) || '',
      })
    );
  }, [id, isEdit]);

  const errors = {
    title: validateTitle(form.title),
    description: validateDescription(form.description),
    pricePerNight: validatePrice(form.pricePerNight),
    imageUrl: validateImageUrl(form.imageUrl),
  };

  const isFormValid =
    !errors.title &&
    !errors.description &&
    !errors.pricePerNight &&
    !errors.imageUrl &&
    Boolean(form.city && form.city.trim()) &&
    Boolean(form.state && form.state.trim()) &&
    Boolean(form.address && form.address.trim());

  const set = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const handleBlur = (key) => () => {
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  // TODO: replace the image URL field with real image upload (Cloudinary / multer).
  const submit = async (e) => {
    e.preventDefault();
    setTouched({
      title: true,
      description: true,
      pricePerNight: true,
      imageUrl: true,
      city: true,
      state: true,
      address: true,
    });
    if (!isFormValid) return;
    setError('');
    const { title, description, type, city, state, address, imageUrl, amenities } = form;
    const payload = {
      title: title.trim(),
      description: description.trim(),
      type,
      city: city.trim(),
      state: state.trim(),
      address: address.trim(),
      pricePerNight: Number(form.pricePerNight),
      maxGuests: Number(form.maxGuests),
      bedrooms: Number(form.bedrooms),
      amenities: amenities.split(',').map((a) => a.trim()).filter(Boolean),
    };
    if (imageUrl.trim()) payload.images = [imageUrl.trim()];
    try {
      if (isEdit) await api.put(`/listings/${id}`, payload);
      else await api.post('/listings', payload);
      navigate('/host');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <form className="card form wide" onSubmit={submit}>
      <h1>{isEdit ? 'Edit listing' : 'Create a new listing'}</h1>
      <div>
        <input
          required
          placeholder="Title"
          value={form.title}
          onChange={set('title')}
          onBlur={handleBlur('title')}
        />
        {touched.title && errors.title && (
          <span className="error small" style={{ display: 'block', marginTop: '4px' }}>
            {errors.title}
          </span>
        )}
      </div>
      <div>
        <textarea
          required
          placeholder="Describe your place"
          value={form.description}
          onChange={set('description')}
          onBlur={handleBlur('description')}
        />
        {touched.description && errors.description && (
          <span className="error small" style={{ display: 'block', marginTop: '4px' }}>
            {errors.description}
          </span>
        )}
      </div>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="grow">
          <select value={form.type} onChange={set('type')}>
            {STAY_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="grow">
          <input
            required
            type="number"
            min="1"
            placeholder="Price per night (₹)"
            value={form.pricePerNight}
            onChange={set('pricePerNight')}
            onBlur={handleBlur('pricePerNight')}
          />
          {touched.pricePerNight && errors.pricePerNight && (
            <span className="error small" style={{ display: 'block', marginTop: '4px' }}>
              {errors.pricePerNight}
            </span>
          )}
        </div>
      </div>
      <div className="row">
        <input required placeholder="City" value={form.city} onChange={set('city')} />
        <input required placeholder="State" value={form.state} onChange={set('state')} />
      </div>
      <input required placeholder="Address" value={form.address} onChange={set('address')} />
      <div className="row">
        <label className="grow">Max guests
          <input type="number" min="1" value={form.maxGuests} onChange={set('maxGuests')} />
        </label>
        <label className="grow">Bedrooms
          <input type="number" min="0" value={form.bedrooms} onChange={set('bedrooms')} />
        </label>
      </div>
      <input placeholder="Amenities (comma separated: WiFi, AC, Parking)" value={form.amenities} onChange={set('amenities')} />
      <div>
        <input
          required
          placeholder="Image URL"
          value={form.imageUrl}
          onChange={set('imageUrl')}
          onBlur={handleBlur('imageUrl')}
        />
        {touched.imageUrl && errors.imageUrl && (
          <span className="error small" style={{ display: 'block', marginTop: '4px' }}>
            {errors.imageUrl}
          </span>
        )}
      </div>
      {error && <p className="error">{error}</p>}
      <button className="btn" disabled={!isFormValid}>
        {isEdit ? 'Save changes' : 'Publish listing'}
      </button>
    </form>
  );
}
