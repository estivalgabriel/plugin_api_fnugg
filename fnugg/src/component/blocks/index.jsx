import ky from 'ky';
import ResortCard from './Resortcard.component.jsx';
import DropdownList from './DropdownList.component.jsx';
import './index.style.css';

const { registerBlockType } = wp.blocks;
const { __ } = wp.i18n;
const { RichText } = wp.editor;
const { useState, useEffect } = wp.element;

registerBlockType('estival/api-fnugg', {
  title: __('Estival API Fnugg', 'estival_plugin'),
  description: __(
    'Based on the response from the API for the selected resort insert a block in the post content that presents the data fields displayed',
    'estival_api_gutenberg_block_plugin'
  ),
  category: 'layout',
  icon: {
    background: '',
    foreground: '#000',
    src: 'admin-network',
  },
  keywords: [__('estival', 'estival_plugin'), __('fnugg', 'estival_plugin')],
  attributes: {
    name: {
      type: 'string',
    },
    condition: {
      type: 'object',
    },
    image: {
      type: 'string',
    },
    last_updated: {
      type: 'string',
    },
  },
  edit: ({ attributes, setAttributes, className }) => {
    const [results, setResults] = useState([]);
    const [query, setQuery] = useState('');
    const [isLoading, setLoading] = useState(false);

    useEffect(() => {
      const fetchItem = async () => {
        const { hits } = await ky.get(`https://api.fnugg.no/search?q=${query}`).json();
        const items = hits.hits.map((item) => item._source);

        setResults(items); // Store the search matches
        setLoading(false); // Explicitly indicate that we're no longer querying the API
        if (items.length) onSelectResult(items[0]); // Default to selecting the first matching result
      };

      setLoading(true); // Explicitly indicate that we're in the process of querying the API
      fetchItem();
    }, [query]); // Filter the query

    const onSelectResult = (result) => {
      const date = new Date(result.last_updated);

      // Just be consistent with the variable name, so we can initiaize it on timeUpdated variable to look cleaner
      const todayDate = ('0' + date.getDate()).slice(-2);
      const todayMonth = ('0' + date.getMonth()).slice(-2);
      const todayYear = date.getFullYear();
      const todayHours = ('0' + date.getHours()).slice(-2);
      const todayMinutes = ('0' + date.getMinutes()).slice(-2);

      const timeUpdated = `${todayDate}.${todayMonth}.${todayYear} - ${todayHours}:${todayMinutes}`;

      const condition = result.conditions.combined.top;
      const description = result.conditions.condition_description;

      setAttributes({
        name: result.name,
        condition: {
          ...condition,
          ...description,
        },
        image: result.images.image_full,
        last_updated: timeUpdated,
      });
    };

    // If no resort has been selected and we're currently querying the API, display a loading message
    if (!attributes.name && isLoading) {
      return <div>Loading...</div>;
    }
    return (
      <div className={className}>
        <ResortCard {...attributes} className={className} />

        <DropdownList array={results} className={className} onChange={onSelectResult} />

        <RichText
          className={`${className}-editor`}
          onChange={setQuery}
          placeholder='Search an resort...'
        />
      </div>
    );
  },

  // Just dump the rendered card with the selected resort's information to post_content
  save: ({ attributes, className }) => <ResortCard {...attributes} className={className} />,
});
