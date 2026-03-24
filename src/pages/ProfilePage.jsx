// ProfilePage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../index.css';

const T = '#343434';
const BLUE = '#7c3aed';
const CARD = { background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', marginBottom: 14 };

function PlainBtn({ children, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: '1px solid #c0c0c0',
        background: hover ? '#f0f0f0' : '#fff',
        color: T,
        fontSize: 15,
        padding: '4px 14px',
        borderRadius: 2,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function TabBar({ tabs, active, onChange }) {
  function TabItem({ label, i }) {
    const [hover, setHover] = useState(false);
    return (
      <div
        onClick={() => onChange(i)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          flex: 1,
          textAlign: 'center',
          padding: '10px 0',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: active === i ? `3px solid ${BLUE}` : '3px solid transparent',
          background: hover && active !== i ? '#f4f4f4' : '#fff',
          fontSize: 15,
          fontWeight: active === i ? 500 : 400,
          color: T,
        }}
      >
        {label}
      </div>
    );
  }

  return (
    <div style={{ ...CARD, marginBottom: 14 }}>
      <div style={{ display: 'flex' }}>
        {tabs.map((label, i) => (
          <TabItem key={label} label={label} i={i} />
        ))}
      </div>
    </div>
  );
}

function SectionHeading({ children }) {
  return <p style={{ fontSize: 20, fontWeight: 400, color: T, margin: '0 0 8px' }}>{children}</p>;
}

function ItemCard({ name }) {
  return (
    <div style={{ border: '1px solid #d8d8d8', background: '#fff', cursor: 'pointer' }}>
      <div style={{ background: '#f0f0f0', aspectRatio: '1' }} />
      <div style={{ padding: '4px 6px' }}>
        <p style={{ fontSize: 14, color: T, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </p>
      </div>
    </div>
  );
}

function GroupToggleBtn({ onClick, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border: '1px solid #c0c0c0',
        background: hover ? '#f0f0f0' : '#fff',
        padding: '5px 8px',
        borderRadius: 2,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}

export default function ProfilePage() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState(0);
  const [groupView, setGroupView] = useState('grid');
  const [loading, setLoading] = useState(true);

  const collections = [
    'Steampunk Fox Mask', 'Lumberjack Hat', 'William "Big Bill" Co...',
    'Amory the Undead...', 'Plasma Disk Top Hat', 'Webbed Centurion...',
  ];
  const groups = ['Group One', 'Group Two', 'Group Three'];

  useEffect(() => {
    document.body.style.background = '#e8e8e8';

    fetch('/Data/users.json')
      .then(res => res.json())
      .then(data => {
        const found = data.users.find(u =>
          u.id.toString() === identifier ||
          u.userName.toLowerCase() === identifier.toLowerCase()
        );

        if (!found || found.isBanned) {
          navigate('/404', { replace: true });
          return;
        }

        setUser(found);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading user data:", err);
        setLoading(false);
      });

    return () => { document.body.style.background = ''; };
  }, [identifier, navigate]);

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;
  if (!user) return <div style={{ padding: 40 }}>User not found</div>;

  return (
    <div style={{ background: '#e8e8e8', minHeight: '100vh', paddingTop: 60 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '16px 16px' }}>

        {/* Profile Header */}
        <div style={CARD}>
          <div style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{
              width: 110, height: 110, borderRadius: '50%',
              border: '1px solid #ccc',
              background: `url(${user.profileImage}) center/cover`,
              flexShrink: 0
            }} />
            <div style={{ flex: 1, paddingTop: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: T }}>{user.displayName}</span>
              </div>
              <p style={{ fontSize: 15, color: T, margin: '0 0 10px', fontStyle: 'normal' }}>
                "{user.bio}"
              </p>
              <div style={{ display: 'flex', gap: 24 }}>
                {[
                  ['Friends', user.friends],
                  ['Followers', user.followers >= 1000000 ? (user.followers / 1000000).toFixed(0) + 'M+' : user.followers],
                  ['Following', user.following]
                ].map(([label, val]) => (
                  <div key={label}>
                    <p style={{ fontSize: 14, color: '#888', margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 17, color: BLUE, margin: 0 }}>{val}</p>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignSelf: 'center', flexShrink: 0 }}>
              <PlainBtn>Message</PlainBtn>
              <PlainBtn>Add Friend</PlainBtn>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <TabBar tabs={['About', 'Creations']} active={tab} onChange={setTab} />

        {/* About */}
        <SectionHeading>About</SectionHeading>
        <div style={{ ...CARD, padding: '14px 16px' }}>
          <p style={{ fontSize: 15, color: T, lineHeight: 1.7, margin: 0 }}>
            {user.bio}
            <br /><br />
            Joined: {user.joined}
          </p>
          <div style={{ textAlign: 'right', marginTop: 10 }}>
            <span style={{ fontSize: 14, color: '#c0392b', cursor: 'pointer' }}>Report Abuse</span>
          </div>
        </div>

        {/* Currently Wearing */}
        <SectionHeading>Currently Wearing</SectionHeading>
        <div style={{ ...CARD, display: 'flex', minHeight: 290 }}>
          <div style={{ width: '50%', display: 'flex', borderRight: '1px solid #ddd' }}>
            <div style={{ width: 70, background: '#f5f5f5', borderRight: '1px solid #ddd', flexShrink: 0 }} />
            <div style={{
              flex: 1, background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
            }}>
              <div style={{
                position: 'absolute', top: 8, right: 8,
                border: '1px solid #ccc', padding: '2px 8px', background: '#fff',
                cursor: 'pointer', fontSize: 14, color: T
              }}>
                3D
              </div>
              <div style={{ width: 90, height: 170, background: '#f0f0f0' }} />
            </div>
          </div>
          <div style={{ flex: 1, background: '#6d28d9', padding: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} style={{ background: '#f0f0f0', border: '1px solid #ccc', aspectRatio: '1', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
        </div>

        {/* Collections */}
        <SectionHeading>Collections</SectionHeading>
        <div style={{ ...CARD, padding: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {collections.map(name => (
              <div key={name} style={{ flex: '1 1 0', minWidth: 0, border: '1px solid #d8d8d8', background: '#fff', cursor: 'pointer' }}>
                <div style={{ background: '#f0f0f0', aspectRatio: '1' }} />
                <div style={{ padding: '4px 6px' }}>
                  <p style={{
                    fontSize: 14, color: T, margin: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>{name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Groups */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <SectionHeading>Groups</SectionHeading>
          <div style={{ display: 'flex', gap: 4 }}>
            <GroupToggleBtn onClick={() => setGroupView('list')}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[1, 2, 3].map(i => <div key={i} style={{ width: 14, height: 2, background: groupView === 'list' ? BLUE : T }} />)}
              </div>
            </GroupToggleBtn>
            <GroupToggleBtn onClick={() => setGroupView('grid')}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {[1, 2, 3, 4].map(i => <div key={i} style={{ width: 6, height: 6, background: groupView === 'grid' ? BLUE : T }} />)}
              </div>
            </GroupToggleBtn>
          </div>
        </div>
        <div style={{ ...CARD, padding: 12 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {groups.map(name => (
              <div key={name} style={{ textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ width: 80, height: 80, border: '1px solid #ccc', background: '#f0f0f0', marginBottom: 4 }} />
                <p style={{ fontSize: 14, color: BLUE, margin: 0 }}>{name}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}