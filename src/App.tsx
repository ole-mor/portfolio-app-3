import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useParams,
} from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import ThreeScene from './components/ThreeScene';
import './App.css';

interface DashboardData {
  id: string;
  name: string;
  docUrl: string;
  description: string;
  image: string;
  author: string; // New field for author information
  date: string;   // New field for date
}

const dashboardsData: DashboardData[] = [
  {
    id: 'postid:1',
    name: 'A practical approach to talking about sustainable development',
    docUrl:
      'https://docs.google.com/document/d/1I1KHYr1Exz3Ll-01l2mPwREJ_4FTcENPGoqpsBtpRx8/export?format=txt',
    description: `It seems like we're about to head into a very important time in history. With gaps between political opinions widening, 
    and information being spread rapidly all over the world. Technologists have to adapt our approach to align with the people we're trying to help.`,
    image: 'https://i.imgur.com/cTtRhoP.png',
    author: 'Ole MO',
    date: 'November 21, 2024',
  },
  {
    id: 'postid:2',
    name: 'Niche-centered applications of programming',
    docUrl:
      'https://docs.google.com/document/d/your_document_id_2/export?format=txt',
    description: 'A detailed overview of dashboard-related analytics.',
    image: 'https://miro.medium.com/v2/resize:fit:800/0*FxXjNMKLbpkw8Zs-.png',
    author: 'Ole MO',
    date: 'November 21, 2024',
  },
  {
    id: 'postid:3',
    name: 'Threejs: Materializing animated 3d objects.',
    docUrl:
      'https://docs.google.com/document/d/1oPDkVSWMnNr393U8yAxK5Wii0YJU91G41faDChVwqJM/export?format=txt',
    description: 'How to use procreate and blender to make cool 3D objects for Threejs.',
    image: 'https://p.turbosquid.com/ts-thumb/3V/zKn549/CD/turntable/png/1629824850/1920x1080/turn_fit_q99/d05f5e8b490e15f499f8e284652c94ae4031dcf8/turntable-1.jpg',
    author: 'Ole MO',
    date: 'November 22, 2024',
  },
  {
    id: 'postid:4',
    name: 'Step by step guide to building software with tesseract-ocr',
    docUrl:
      'https://docs.google.com/document/d/1FKihyqy0M6BFgx6zZM5sDzbInnH2C4RJMHqR5p44k_w/export?format=txt',
    description: `Usually out of the box software is kind of hard to work with, and the methods to build with these tools are
    not necessarily easy to come by, or is written in an unaccessable way. In this post I will go through how to work with the
    open-source software tesseract-ocr, and guide you how to test it on your system, as well as how to integrate it with your
    builds. After you've read this article, you'll be able to use the semantic query system of tesseract, and automate certain
    processes. Simultainousl, you might be able to use these skills with other software.`,
    image: 'https://www.klippa.com/wp-content/uploads/2022/10/tesseract-software-visual-1024x480.png',
    author: 'Ole MO',
    date: '25 november, 2024',
  },
  {
    id: 'postid:5',
    name: 'Nextjs workflow. Making quick and reliable websites.',
    docUrl:
      'https://docs.google.com/document/d/1FKihyqy0M6BFgx6zZM5sDzbInnH2C4RJMHqR5p44k_w/export?format=txt',
    description: `Usually out of the box software is kind of hard to work with, and the methods to build with these tools are
    not necessarily easy to come by, or is written in an unaccessable way. In this post I will go through how to work with the
    open-source software tesseract-ocr, and guide you how to test it on your system, as well as how to integrate it with your
    builds. After you've read this article, you'll be able to use the semantic query system of tesseract, and automate certain
    processes. Simultainousl, you might be able to use these skills with other software.`,
    image: 'https://www.klippa.com/wp-content/uploads/2022/10/tesseract-software-visual-1024x480.png',
    author: 'Ole MO',
    date: '25 november, 2024',
  },
  {
    id: 'postid:6',
    name: 'Into React 19!',
    docUrl:
      'https://docs.google.com/document/d/1NMicl4cW_6jCe8DyoH9jDZ1mWRD-TkoqE9945bCYKrg/export?format=txt',
    description: ``,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRu-1OLE6D2tMpFTiBD6v1Z-UqbCu2SBPup5w&s',
    author: 'Ole MO',
    date: '25 november, 2024',
  },
];


interface NavbarProps {
  showNavbar: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ showNavbar }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <nav className={`navbar ${showNavbar ? 'visible' : ''}`}>
      <div className="nav-container">
        <div className="nav-home">
          <ul className="hci-logo">
            <Link
              className="App-link"
              to="/"
              onClick={() => {setIsMenuOpen(false)
                setTimeout(() => window.scrollTo(0, 0), 0);
              }}
            >
              Home
            </Link>
          </ul>
          <button
            className={`menu-button ${isMenuOpen ? 'open' : ''}`}
            onClick={toggleMenu}
          >
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>
        <div className={`nav-rest ${isMenuOpen ? 'open' : 'closed'}`}>
          <ul>
            <li key="apropos">
              <Link
                className="App-link"
                to="/apropos"
                onClick={() => setIsMenuOpen(false)}
              >
                Apropos
              </Link>
            </li>
            <li key="blogposts">
              <Link
                className="App-link"
                to="/blogposts"
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

const Blogpost: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [docContent, setDocContent] = useState<string | null>(null);

  const dashboardData = dashboardsData.find((blogpost) => blogpost.id === id);

  useEffect(() => {
    if (dashboardData) {
      const fetchDocContent = async () => {
        try {
          const response = await fetch(dashboardData.docUrl);
          if (response.ok) {
            const text = await response.text();
            setDocContent(text);
          } else {
            console.error('Failed to fetch document content');
          }
        } catch (error) {
          console.error('Error fetching document:', error);
        }
      };

      fetchDocContent();

      const intervalId = setInterval(() => {
        fetchDocContent();
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, [dashboardData]);

  if (!dashboardData) {
    return <div>Dashboard not found</div>;
  }

  return (
    <div className="dashboard-content">
      <div className="blog-content">
        <img
          src={dashboardData.image}
          alt={`${dashboardData.name} header`}
          className="header-image"
        />
        <p className="blog-content-name-and-date">
          {dashboardData.date}
          <span style={{ padding: '0 10px' }}>
            <strong>·</strong>
          </span>
          {dashboardData.author}
        </p>
        <h2 style={{ marginTop: "20px" }}>{dashboardData.name}</h2>
        <p>{dashboardData.description}</p>
        {docContent && (
          <ReactMarkdown>{docContent}</ReactMarkdown>
        )}
        <Link
          className="App-link"
          to="/blogposts"
          onClick={() => window.scrollTo(0, 0)}
        >
          Back to Blogposts
        </Link>
        <div className="footer"></div>
      </div>
    </div>
  );
};

const Blogposts: React.FC = () => (
  <div className="dashboards-content">
    <h1>Blogposts</h1>
    <ul className="dashboard-list">
      {dashboardsData.map((blogpost) => (
        <li key={blogpost.id} className="dashboard-item">
          <Link className="dashboard-link" to={`/blogpost/${blogpost.id}`}>
            <img
              src={blogpost.image}
              alt={`${blogpost.name} header`}
              className="dashboard-image"
            />
            <div className="dashboard-info">
              <h3>{blogpost.name}</h3>
              <p><strong>Author:</strong> {blogpost.author}</p>
              <p><strong>Date:</strong> {blogpost.date}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
    <Link
        className="App-link"
        to="/"
        onClick={() => window.scrollTo(0, 0)}
      >
        Back Home
      </Link>
  </div>
);


const Apropos: React.FC = () => (
  <div className="apropos-content">
    <div className="text-mid">
      <p>
        This is an experimental project. I wish to find useful user interactions,
        test architectural designs, and document engineering projects.
      </p>
      <p>- Ole Mathias Ornæs</p>
    </div>
    <Link
      className="App-link"
      to="/"
      onClick={() => window.scrollTo(0, 0)}
    >
      Go to Home
    </Link>
  </div>
);

interface ModelProps {
  src: string;
  scale: [number, number, number];
  position: [number, number, number];
  link: string;
}

const Home: React.FC = () => {
  const models: ModelProps[] = [
    {
      src: '/models/model4-pc-kirbyscreen1.glb',
      scale: [0.2, 0.2, 0.2],
      position: [-10, 0, -10],
      link: '/blogposts',
    },
    {
      src: '/models/travel-model3-conversion-test-anim5.glb',
      scale: [0.6, 0.6, 0.6],
      position: [-12, 0, 2],
      link: '/blogposts',
    },
    {
      src: '/models/glass-model5-out2.glb',
      scale: [0.6, 0.6, 0.6],
      position: [0, 0, -10],
      link: 'https://clinkclank.netlify.app/',
    }, 
/*     {
      src: '/models/model1-stats-animated-colored.glb',
      scale: [0.8, 0.8, 0.8],
      position: [0, 0, -10],
      link: '/dashboard',
    }, */
    /*
    {
      src: '/models/model5.glb',
      scale: [1, 1, 1],
      position: [0, 0, 0],
      link: '/newmodel',
    },
    {
      src: '/models/model6.glb',
      scale: [1, 1, 1],
      position: [0, 0, 10],
      link: '/dashboard',
    },
    {
      src: '/models/model7.glb',
      scale: [1, 1, 1],
      position: [10, 0, -10],
      link: '/dashboard',
    },
    {
      src: '/models/model8.glb',
      scale: [1, 1, 1],
      position: [10, 0, 0],
      link: '/newmodel',
    },
    {
      src: '/models/model9.glb',
      scale: [1, 1, 1],
      position: [1, 0, 10],
      link: '/newmodel',
    }, */
  ];

  return (
    <div className="homepage-content">
      <div className="canvas-1">
        <ThreeScene models={models} />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const vh = window.innerHeight;
      const fade = 1 - scrollY / (vh * 2);

      root.style.setProperty('--fade', fade.toString());
    };

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('', handleScroll);
  }, []);

  return (
    <div className="App">
      <Navbar showNavbar={true} />
      <TransitionGroup>
        <CSSTransition key={location.key} classNames="fade" timeout={500}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/apropos" element={<Apropos />} />
            <Route path="/blogposts" element={<Blogposts />} />
            <Route path="/blogpost/:id" element={<Blogpost />} />
          </Routes>
        </CSSTransition>
      </TransitionGroup>
    </div>
  );
};

const AppWrapper: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
