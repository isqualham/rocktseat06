import Prismic from '@prismicio/client'
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { AiOutlineCalendar } from 'react-icons/ai';
import { FaUserTie } from 'react-icons/fa';
import {FiClock} from 'react-icons/fi';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({post}: PostProps){

  function heandleReadingTime(post: Post): number {
    const wordsPerMinute = 200;
    const wordsCount =
      RichText.asText(
        post.data.content.reduce((acc, data) => [...acc, ...data.body], [])
      ).split(' ').length +
      RichText.asText(
        post.data.content.reduce((acc, data) => {
          if (data.heading) {
            return [...acc, ...data.heading.split(' ')];
          }
          return [...acc];
        }, [])
      ).split(' ').length;
  
    const readingEstimatedTime = Math.ceil(wordsCount / wordsPerMinute);
    return readingEstimatedTime;
  }


  const router = useRouter();

  if(router.isFallback){
    return <h1>Carregando...</h1>
  }


  const readingTime = heandleReadingTime(post);

  return(
    <>
      <Head>
        <title>freitas</title>
      </Head>

      <main className={commonStyles.contentContainer}>

        <Header /> 

        <header className={styles.head}>                                  
          <div><img src={post.data.banner.url} alt="imagem" className={styles.banner}/></div>
        </header>

        <section className={styles.container}>

            <h1>{post.data.title}</h1>

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
                <FiClock />
                <span>{`${readingTime} min`}</span>                   
                                 
            </div>

            {post.data.content.map(post =>{
              return (
                <section key={post.heading}>
                  <h3>{post.heading}</h3>
                  <p>{RichText.asText(post.body)}</p>
                </section>     
              );
            })} 

            
        </section>
      </main>
    </>
  );

}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.uid'],
      pageSize: 3,
    }
  );
  const paths = postsResponse.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps : GetStaticProps = async ({params,}) => {    
  const {slug} = params;
  const prismic = getPrismicClient()

  const response = await prismic.getByUID<any>('posts', String(slug),{}) 

  return {
      props:{
        post: response,
      },
      revalidate: 60 * 30 * 24, // 1day
  }
}
