import React, { useState, useEffect, useReducer } from 'react';
import { Container, Row, InputGroup, FormControl, Card, Col, Dropdown } from 'react-bootstrap';
import { sortBy } from 'lodash';
//REST API 
const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

//reducers
const storiesReducer = (state, action) => {
  switch (action.type) {
    case 'STORIES_FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case 'STORIES_FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case 'STORIES_FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    case 'REMOVE_STORY':
      return {
        ...state,
        data: state.data.filter(
          story => action.payload.objectID !== story.objectID
        ),
      };
    default:
      throw new Error();
  };
}

// dummy data 
const initialstories = [
  {
    title: 'React',
    url: 'https://reactjs.org/',
    author: 'Jordan Walke',
    num_comments: 3,
    points: 4,
    objectID: 0,
  },
  {
    title: 'Redux',
    url: 'https://redux.js.org/',
    author: 'Dan Abramov, Andrew Clark',
    num_comments: 2,
    points: 5,
    objectID: 1,
  },
];

// reusable persistent custom hook just of the sake of learning
const useSemiPersistentState = (key, initialState) => {
  const [value, setvalue] = useState(
    localStorage.getItem(key) || initialState);

  useEffect(() => {
    localStorage.setItem(key, value);
  }, [value, key])
  return [value, setvalue];
}


const App = () => {
  const [searchTerm, setSearchTerm] = useSemiPersistentState('search', 'react');
  const [stories, dispatchStories] = useReducer(storiesReducer, { data: [], isLoading: false, isError: false });
  const [sort, setSort] = React.useState('NONE');

  useEffect(() => {
    if (!searchTerm) return;
    dispatchStories({ type: 'STORIES_FETCH_INIT' });

    fetch(`${API_ENDPOINT}${searchTerm}`)
      .then(response => response.json())
      .then(result => {
        dispatchStories({
          type: 'STORIES_FETCH_SUCCESS',
          payload: result.hits
        })
      }).catch(() =>
        dispatchStories({ type: 'STORIES_FETCH_FAILURE' })
      );
  }, [searchTerm]);

  const handleRemoveStory = item => {
    dispatchStories({
      type: 'REMOVE_STORY',
      payload: item
    })
  }

  const handleSearch = event => {
    setSearchTerm(event.target.value);
  };
  const handleSort = sortKey => {
    setSort(sortKey);
  };

  return (
    <Container className='mt-2'>
      <Row className="justify-content-md-center">
        <h1>My Hacker Stories</h1>
      </Row>

      <Row className='justify-content-md-center'>
        <Col md={6}>
          <InputReusable
            id="search"
            value={searchTerm}
            onInputChange={handleSearch}
          >Search</InputReusable>
        </Col>
        <Col md={2}>
          <Dropdown>
            <Dropdown.Toggle variant="success" id="dropdown-basic">
              sort by
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Item href="#" onClick={() => handleSort('title')} >Title</Dropdown.Item>
              <Dropdown.Item href="#" onClick={() => handleSort('author')} >Author</Dropdown.Item>
              <Dropdown.Item href="#" onClick={() => handleSort('comments')} >Comment</Dropdown.Item>
              <Dropdown.Item href="#" onClick={() => handleSort('points')}>Points</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Col>
      </Row>
      <Row className='justify-content-md-center mt-2' >

        {stories.isError && <p>Something went wrong ...</p>}
        {
          stories.isLoading ? (
            <p>Loading...</p>
          ) : (
              <Col md={8}>
                <List list={stories.data} sort={sort} onRemoveItem={handleRemoveStory} />
              </Col>
            )
        }

      </Row>

    </Container>

  )
}
//custom reusable component just for sake of learning
const InputReusable = ({
  id,
  value,
  type = 'text',
  onInputChange,
  children
}) => (
    <>
      <InputGroup>
        <FormControl placeholder={children} id={id} type={type} value={value} onChange={onInputChange} />
      </InputGroup>
    </>
  );

const List = ({ list, sort, onRemoveItem }) => {
  const SORTS = {
    NONE: list => list,
    title: list => sortBy(list, 'title'),
    author: list => sortBy(list, 'author'),
    comments: list => sortBy(list, 'num_comments').reverse(),
    points: list => sortBy(list, 'points').reverse(),
  };
  const sortFunction = SORTS[sort];
  const sortedList = sortFunction(list);

  return (
    sortedList.map(item =>

      <Item
        key={item.objectID}
        item={item}
        onRemoveItem={onRemoveItem}
      />

    )
  );
}


const Item = ({ item, onRemoveItem }) => {
  return (

    <Card border='secondary' className='mb-1'>
      <Card.Body>
        <Card.Text>
          <Card.Link href={item.url}>{item.title}</Card.Link><br />
          <small>
            {item.points} points by {item.author} | {item.num_comments} comments
                            <sub>
              <a href='/'><i onClick={(e) => { e.preventDefault(); onRemoveItem(item) }} className="material-icons">clear</i></a>
            </sub>
          </small>

        </Card.Text>
      </Card.Body>
    </Card>
  );
}


export default App;