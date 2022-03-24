import Prismic from '@prismicio/client'
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';
import {AiOutlineCalendar} from 'react-icons/ai'; 
import {FaUserTie} from 'react-icons/fa';

import Head from 'next/head';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';
import Header from '../components/Header';


interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

 export default function Home({postsPagination}: HomeProps) {

  const formattedPost = postsPagination.results.map(post => {
    return {
      ...post,
      data: {
        ...post.data,
      },
    };
  });

  const [posts, setPosts] = useState<Post[]>(formattedPost);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);

  async function handleNextPage(): Promise<void> {
    
    if (currentPage !== 1 && nextPage === null) {
      return;
    }

    const postsResults = await fetch(`${nextPage}`).then(response =>
      response.json()
    );
    
    setNextPage(postsResults.next_page);
    setCurrentPage(postsResults.page);

    const newPosts = postsResults.results.map((post: Post) => {      

      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts([...posts, ...newPosts]);
  }

  
   return(
     <>
      <Head>
        <title>desafio 5 RockSeat</title>        
      </Head>

      <main className={commonStyles.contentContainer}>

        <Header />

        <section className={styles.posts}>          

          {posts.map(post =>(
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a href="#" >                   
                  <h1>{post.data.title}</h1>
                  <p>{post.data.subtitle}</p>
                  <div>
                    <AiOutlineCalendar/>
                    <time>
                      {
                        format(new Date(post.first_publication_date),
                        'dd MMM yyyy', {locale: ptBR,})                          
                      }
                    </time> 

                    <FaUserTie />  
                    <span>{post.data.author}</span>
                    
                  </div>
                </a>
              </Link>                        
            ))}

        </section>

        {nextPage &&(
          <section>
          <a onClick={handleNextPage} href="#">Carregar mais posts</a>          
          </section> 
        )}     

      </main>
     </>
   )
  }

 
export const getStaticProps : GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query<any>([
    Prismic.Predicates.at('document.type', 'posts')
],{
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1,
});

const posts = postsResponse.results.map(post => {
  return {
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      title: post.data.title,
      subtitle: post.data.subtitle,
      author: post.data.author,
    },
  };
});

//console.log(JSON.stringify(postsResponse, null, 2))

return {
  props: {
    postsPagination: {
      next_page: postsResponse.next_page,
      results: posts,
    },
  },
  revalidate: 60 * 30 * 24, // 1day
  }
}

